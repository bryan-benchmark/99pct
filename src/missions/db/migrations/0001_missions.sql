CREATE TABLE human_accounts (
  firebase_uid TEXT PRIMARY KEY,
  verified_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(firebase_uid) BETWEEN 1 AND 128),
  CHECK (length(verified_email) BETWEEN 3 AND 320)
);

CREATE TABLE missions (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  creator_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status = 'forming'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (length(slug) BETWEEN 1 AND 60)
);

CREATE TABLE mission_revisions (
  mission_id UUID NOT NULL REFERENCES missions(id),
  revision INTEGER NOT NULL CHECK (revision > 0),
  author_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  beneficiaries TEXT NOT NULL,
  starting_place TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, revision),
  CHECK (length(trim(name)) BETWEEN 2 AND 80),
  CHECK (length(trim(purpose)) BETWEEN 8 AND 500),
  CHECK (length(trim(beneficiaries)) BETWEEN 2 AND 160),
  CHECK (length(trim(starting_place)) BETWEEN 2 AND 80)
);

CREATE FUNCTION reject_mission_revision_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'mission revisions are append-only';
END;
$$;

CREATE TRIGGER mission_revisions_no_update
  BEFORE UPDATE ON mission_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_mission_revision_mutation();

CREATE TRIGGER mission_revisions_no_delete
  BEFORE DELETE ON mission_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_mission_revision_mutation();
