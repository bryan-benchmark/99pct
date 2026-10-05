CREATE TABLE economic.command_intents (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL,
  command_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_kind TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  payload JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  UNIQUE (mission_id, idempotency_key),
  CHECK (command_type IN (
    'publish_rule', 'activate_rule', 'recognize_contribution', 'adjust_mcu',
    'publish_bounty_terms', 'confirm_bounty_participation', 'recognize_bounty_completion'
  )),
  CHECK (actor_kind IN ('human', 'process')),
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  CHECK (length(actor_ref) BETWEEN 1 AND 120)
);

CREATE TRIGGER intents_no_update BEFORE UPDATE ON economic.command_intents
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER intents_no_delete BEFORE DELETE ON economic.command_intents
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER intents_no_truncate BEFORE TRUNCATE ON economic.command_intents
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();
