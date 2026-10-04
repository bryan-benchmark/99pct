CREATE SCHEMA IF NOT EXISTS economic;

CREATE TABLE IF NOT EXISTS economic.schema_migrations (
  name TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE economic.commands (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL,
  command_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  canonical_hash TEXT NOT NULL,
  canonical_payload JSONB NOT NULL,
  actor_kind TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  UNIQUE (mission_id, idempotency_key),
  CHECK (command_type IN (
    'publish_rule', 'activate_rule', 'recognize_contribution', 'adjust_mcu',
    'publish_bounty_terms', 'confirm_bounty_participation', 'recognize_bounty_completion'
  )),
  CHECK (actor_kind IN ('human', 'process')),
  CHECK (jsonb_typeof(canonical_payload) = 'object'),
  CHECK (canonical_hash ~ '^[0-9a-f]{64}$'),
  CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  CHECK (length(actor_ref) BETWEEN 1 AND 120)
);

CREATE TABLE economic.events (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL,
  sequence BIGINT NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL,
  command_id UUID NOT NULL REFERENCES economic.commands (id),
  actor_kind TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  subject_kind TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  rule_id TEXT,
  rule_version BIGINT,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  UNIQUE (mission_id, sequence),
  CHECK (event_type IN (
    'rule_published', 'rule_activated', 'contribution_recognized', 'mcu_granted', 'mcu_adjusted',
    'bounty_terms_published', 'bounty_participation_confirmed', 'bounty_completion_recognized', 'bounty_reward_granted'
  )),
  CHECK (actor_kind IN ('human', 'process')),
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  CHECK (event_hash ~ '^[0-9a-f]{64}$'),
  CHECK (previous_event_hash IS NULL OR previous_event_hash ~ '^[0-9a-f]{64}$'),
  CHECK ((rule_id IS NULL) = (rule_version IS NULL)),
  CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR (sequence > 1 AND previous_event_hash IS NOT NULL)),
  CHECK (length(subject_kind) BETWEEN 1 AND 40),
  CHECK (length(subject_ref) BETWEEN 1 AND 120)
);

CREATE TABLE economic.rule_versions (
  mission_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  version BIGINT NOT NULL CHECK (version > 0),
  rule_kind TEXT NOT NULL,
  definition JSONB NOT NULL,
  definition_hash TEXT NOT NULL,
  published_event_id UUID NOT NULL REFERENCES economic.events (id),
  published_sequence BIGINT NOT NULL,
  PRIMARY KEY (mission_id, rule_id, version),
  CHECK (rule_kind = 'fixed_mcu_on_recognition'),
  CHECK (jsonb_typeof(definition) = 'object'),
  CHECK (definition_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE economic.reward_keys (
  mission_id UUID NOT NULL,
  reward_key TEXT NOT NULL,
  event_id UUID NOT NULL UNIQUE REFERENCES economic.events (id),
  PRIMARY KEY (mission_id, reward_key),
  CHECK (length(reward_key) BETWEEN 1 AND 300)
);

CREATE FUNCTION economic.reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'economic history is append-only';
END;
$$;

CREATE TRIGGER commands_no_update BEFORE UPDATE ON economic.commands
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER commands_no_delete BEFORE DELETE ON economic.commands
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER commands_no_truncate BEFORE TRUNCATE ON economic.commands
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();

CREATE TRIGGER events_no_update BEFORE UPDATE ON economic.events
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER events_no_delete BEFORE DELETE ON economic.events
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER events_no_truncate BEFORE TRUNCATE ON economic.events
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();

CREATE TRIGGER rules_no_update BEFORE UPDATE ON economic.rule_versions
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER rules_no_delete BEFORE DELETE ON economic.rule_versions
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER rules_no_truncate BEFORE TRUNCATE ON economic.rule_versions
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();

CREATE TRIGGER rewards_no_update BEFORE UPDATE ON economic.reward_keys
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER rewards_no_delete BEFORE DELETE ON economic.reward_keys
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER rewards_no_truncate BEFORE TRUNCATE ON economic.reward_keys
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();

CREATE TRIGGER migrations_no_update BEFORE UPDATE ON economic.schema_migrations
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER migrations_no_delete BEFORE DELETE ON economic.schema_migrations
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
