CREATE TABLE projects (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES missions(id),
  slug TEXT NOT NULL,
  created_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = 'active'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, slug),
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (length(slug) BETWEEN 1 AND 60)
);

CREATE TABLE project_revisions (
  project_id UUID NOT NULL REFERENCES projects(id),
  revision INTEGER NOT NULL CHECK (revision > 0),
  author_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  title TEXT NOT NULL,
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, revision),
  CHECK (length(trim(title)) BETWEEN 2 AND 80),
  CHECK (length(trim(outcome)) BETWEEN 8 AND 500)
);

CREATE TABLE work_items (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  slug TEXT NOT NULL,
  created_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  kind TEXT NOT NULL CHECK (kind IN ('task', 'role')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status = 'open'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug),
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (length(slug) BETWEEN 1 AND 60)
);

CREATE TABLE work_revisions (
  work_id UUID NOT NULL REFERENCES work_items(id),
  revision INTEGER NOT NULL CHECK (revision > 0),
  author_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  done_when TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (work_id, revision),
  CHECK (length(trim(title)) BETWEEN 2 AND 80),
  CHECK (length(trim(description)) BETWEEN 8 AND 500),
  CHECK (length(trim(done_when)) BETWEEN 8 AND 240)
);

CREATE FUNCTION reject_project_revision_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'project revisions are append-only';
END;
$$;

CREATE TRIGGER project_revisions_no_update
  BEFORE UPDATE ON project_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_project_revision_mutation();

CREATE TRIGGER project_revisions_no_delete
  BEFORE DELETE ON project_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_project_revision_mutation();

CREATE FUNCTION reject_work_revision_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'work revisions are append-only';
END;
$$;

CREATE TRIGGER work_revisions_no_update
  BEFORE UPDATE ON work_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_work_revision_mutation();

CREATE TRIGGER work_revisions_no_delete
  BEFORE DELETE ON work_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_work_revision_mutation();
