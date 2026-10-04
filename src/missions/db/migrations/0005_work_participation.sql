CREATE TABLE work_invitations (
  id UUID PRIMARY KEY,
  interest_id UUID NOT NULL UNIQUE REFERENCES work_interests(id),
  invited_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE work_confirmations (
  invitation_id UUID PRIMARY KEY REFERENCES work_invitations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION reject_work_invitation_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'work invitations are append-only';
END;
$$;

CREATE TRIGGER work_invitations_no_update
  BEFORE UPDATE ON work_invitations
  FOR EACH ROW EXECUTE FUNCTION reject_work_invitation_mutation();

CREATE TRIGGER work_invitations_no_delete
  BEFORE DELETE ON work_invitations
  FOR EACH ROW EXECUTE FUNCTION reject_work_invitation_mutation();

CREATE FUNCTION reject_work_confirmation_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'work confirmations are append-only';
END;
$$;

CREATE TRIGGER work_confirmations_no_update
  BEFORE UPDATE ON work_confirmations
  FOR EACH ROW EXECUTE FUNCTION reject_work_confirmation_mutation();

CREATE TRIGGER work_confirmations_no_delete
  BEFORE DELETE ON work_confirmations
  FOR EACH ROW EXECUTE FUNCTION reject_work_confirmation_mutation();
