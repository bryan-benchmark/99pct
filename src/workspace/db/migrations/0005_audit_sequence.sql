-- Historical timestamps are transaction start times, so their prior display
-- order is only a best-effort backfill. New events get an organization-local
-- sequence while holding the organization row lock.
ALTER TABLE audit_events ADD COLUMN org_seq BIGINT;
ALTER TABLE audit_events ADD COLUMN sequence_backfilled BOOLEAN NOT NULL DEFAULT false;

DROP TRIGGER audit_events_immutable ON audit_events;
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY org_id ORDER BY occurred_at, id) AS seq
  FROM audit_events
)
UPDATE audit_events AS event
   SET org_seq = ordered.seq, sequence_backfilled = true
  FROM ordered
 WHERE event.id = ordered.id;
ALTER TABLE audit_events ALTER COLUMN org_seq SET NOT NULL;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_org_seq_unique UNIQUE (org_id, org_seq);

CREATE FUNCTION assign_workspace_audit_sequence() RETURNS trigger AS $$
BEGIN
  PERFORM 1 FROM organizations WHERE id = NEW.org_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace organization does not exist';
  END IF;
  SELECT COALESCE(MAX(org_seq), 0) + 1 INTO NEW.org_seq
    FROM audit_events WHERE org_id = NEW.org_id;
  NEW.sequence_backfilled := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_assign_sequence BEFORE INSERT ON audit_events
  FOR EACH ROW EXECUTE FUNCTION assign_workspace_audit_sequence();
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_workspace_history_change();
