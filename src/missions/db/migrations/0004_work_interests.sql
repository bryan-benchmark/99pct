CREATE TABLE work_interests (
  id UUID PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES work_items(id),
  human_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  private_note TEXT NOT NULL DEFAULT '',
  email_share_consented BOOLEAN NOT NULL CHECK (email_share_consented = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (work_id, human_uid),
  CHECK (length(private_note) <= 500)
);

CREATE FUNCTION reject_work_interest_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'work interests are append-only';
END;
$$;

CREATE TRIGGER work_interests_no_update
  BEFORE UPDATE ON work_interests
  FOR EACH ROW EXECUTE FUNCTION reject_work_interest_mutation();

CREATE TRIGGER work_interests_no_delete
  BEFORE DELETE ON work_interests
  FOR EACH ROW EXECUTE FUNCTION reject_work_interest_mutation();
