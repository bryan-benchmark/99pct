CREATE TABLE contributions (
  id UUID PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES work_items(id),
  participant_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  submitted_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  summary TEXT NOT NULL,
  evidence_note TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (work_id, participant_uid, idempotency_key),
  CHECK (participant_uid = submitted_by_uid),
  CHECK (length(btrim(summary)) BETWEEN 1 AND 500),
  CHECK (length(evidence_note) <= 500),
  CHECK (idempotency_key ~ '^[A-Za-z0-9._:-]{1,200}$')
);

CREATE TABLE contributor_refs (
  firebase_uid TEXT PRIMARY KEY REFERENCES human_accounts(firebase_uid),
  contributor_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (contributor_ref ~ '^contributor:[a-z0-9][a-z0-9._:-]{0,80}$')
);

CREATE TABLE contribution_recognitions (
  contribution_id UUID PRIMARY KEY REFERENCES contributions(id),
  recognized_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  rule_id TEXT NOT NULL,
  rule_version BIGINT NOT NULL CHECK (rule_version > 0),
  bridge_idempotency_key TEXT NOT NULL UNIQUE,
  recognized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (rule_id ~ '^[a-z0-9][a-z0-9._:-]{0,80}$'),
  CHECK (bridge_idempotency_key ~ '^[A-Za-z0-9._:-]{1,200}$')
);

CREATE TABLE contribution_bridge_outcomes (
  contribution_id UUID PRIMARY KEY REFERENCES contribution_recognitions(contribution_id),
  economic_intent_id UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contribution_anchors (
  contribution_id UUID PRIMARY KEY REFERENCES contributions(id),
  amount TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version BIGINT NOT NULL,
  event_id UUID NOT NULL,
  checkpoint_sequence BIGINT NOT NULL CHECK (checkpoint_sequence > 0),
  anchored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (amount ~ '^[1-9][0-9]*$')
);

CREATE FUNCTION reject_contribution_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'contributions are append-only';
END;
$$;

CREATE TRIGGER contributions_no_update BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contributions_no_delete BEFORE DELETE ON contributions
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contributor_refs_no_update BEFORE UPDATE ON contributor_refs
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contributor_refs_no_delete BEFORE DELETE ON contributor_refs
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_recognitions_no_update BEFORE UPDATE ON contribution_recognitions
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_recognitions_no_delete BEFORE DELETE ON contribution_recognitions
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_bridge_outcomes_no_update BEFORE UPDATE ON contribution_bridge_outcomes
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_bridge_outcomes_no_delete BEFORE DELETE ON contribution_bridge_outcomes
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_anchors_no_update BEFORE UPDATE ON contribution_anchors
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
CREATE TRIGGER contribution_anchors_no_delete BEFORE DELETE ON contribution_anchors
  FOR EACH ROW EXECUTE FUNCTION reject_contribution_mutation();
