CREATE TABLE economic.checkpoints (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL,
  last_sequence BIGINT NOT NULL CHECK (last_sequence > 0),
  last_event_hash TEXT NOT NULL,
  event_count BIGINT NOT NULL CHECK (event_count > 0),
  checkpoint_at TIMESTAMPTZ NOT NULL,
  signer_ref TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  signature TEXT NOT NULL,
  UNIQUE (mission_id, last_event_hash),
  CHECK (event_count = last_sequence),
  CHECK (last_event_hash ~ '^[0-9a-f]{64}$'),
  CHECK (length(signer_ref) BETWEEN 1 AND 300),
  CHECK (length(public_key_pem) BETWEEN 1 AND 4000),
  CHECK (length(signature) BETWEEN 1 AND 500)
);

CREATE TRIGGER checkpoints_no_update BEFORE UPDATE ON economic.checkpoints
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER checkpoints_no_delete BEFORE DELETE ON economic.checkpoints
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER checkpoints_no_truncate BEFORE TRUNCATE ON economic.checkpoints
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();
