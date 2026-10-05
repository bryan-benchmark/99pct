ALTER TABLE economic.command_intents
  ADD COLUMN submitter_capability TEXT NOT NULL,
  ADD CONSTRAINT command_intents_capability_check CHECK (
    (submitter_capability = 'human' AND command_type = 'confirm_bounty_participation' AND actor_kind = 'human')
    OR (submitter_capability = 'recognition' AND command_type IN ('recognize_contribution', 'adjust_mcu') AND actor_kind = 'process' AND actor_ref = 'recognition')
    OR (submitter_capability = 'governance' AND command_type IN ('publish_rule', 'activate_rule') AND actor_kind = 'process' AND actor_ref = 'rule-publisher')
    OR (submitter_capability = 'bounty_recognition' AND command_type = 'recognize_bounty_completion' AND actor_kind = 'process' AND actor_ref = 'bounty-recognition')
  );

CREATE TABLE economic.intent_outcomes (
  intent_id UUID PRIMARY KEY REFERENCES economic.command_intents (id),
  outcome TEXT NOT NULL,
  command_id UUID REFERENCES economic.commands (id),
  refusal_code TEXT,
  processed_at TIMESTAMPTZ NOT NULL,
  worker_ref TEXT NOT NULL,
  CHECK (outcome IN ('accepted', 'refused')),
  CHECK (
    (outcome = 'accepted' AND command_id IS NOT NULL AND refusal_code IS NULL)
    OR (outcome = 'refused' AND command_id IS NULL AND refusal_code IS NOT NULL)
  ),
  CHECK (refusal_code IS NULL OR length(refusal_code) BETWEEN 1 AND 80),
  CHECK (length(worker_ref) BETWEEN 1 AND 120)
);

CREATE TRIGGER outcomes_no_update BEFORE UPDATE ON economic.intent_outcomes
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER outcomes_no_delete BEFORE DELETE ON economic.intent_outcomes
  FOR EACH ROW EXECUTE FUNCTION economic.reject_mutation();
CREATE TRIGGER outcomes_no_truncate BEFORE TRUNCATE ON economic.intent_outcomes
  FOR EACH STATEMENT EXECUTE FUNCTION economic.reject_mutation();

CREATE FUNCTION economic.submit_human_intent(p_mission_id UUID, p_idempotency_key TEXT, p_actor_ref TEXT, p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = economic, pg_temp
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  existing_id UUID;
  existing_payload JSONB;
  existing_actor TEXT;
BEGIN
  IF p_mission_id IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{1,200}$' OR p_actor_ref !~ '^[a-z0-9][a-z0-9._:-]{0,80}$' OR p_actor_ref LIKE '%@%' THEN
    RAISE EXCEPTION 'invalid human intent' USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid human intent' USING ERRCODE = '22023';
  END IF;
  INSERT INTO economic.command_intents (
    id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitted_at, submitter_capability
  ) VALUES (
    new_id, p_mission_id, 'confirm_bounty_participation', p_idempotency_key, 'human', p_actor_ref, p_payload, clock_timestamp(), 'human'
  );
  RETURN new_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id, payload, actor_ref INTO existing_id, existing_payload, existing_actor
      FROM economic.command_intents
     WHERE mission_id = p_mission_id AND idempotency_key = p_idempotency_key;
    IF existing_actor = p_actor_ref AND existing_payload = p_payload THEN
      RETURN existing_id;
    END IF;
    RAISE EXCEPTION 'idempotency conflict' USING ERRCODE = '23505';
END;
$$;

CREATE FUNCTION economic.submit_recognition_intent(p_mission_id UUID, p_command_type TEXT, p_idempotency_key TEXT, p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = economic, pg_temp
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  existing_id UUID;
  existing_type TEXT;
  existing_payload JSONB;
BEGIN
  IF p_command_type NOT IN ('recognize_contribution', 'adjust_mcu') THEN
    RAISE EXCEPTION 'capability refused' USING ERRCODE = '42501';
  END IF;
  IF p_mission_id IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{1,200}$' OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid recognition intent' USING ERRCODE = '22023';
  END IF;
  INSERT INTO economic.command_intents (
    id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitted_at, submitter_capability
  ) VALUES (
    new_id, p_mission_id, p_command_type, p_idempotency_key, 'process', 'recognition', p_payload, clock_timestamp(), 'recognition'
  );
  RETURN new_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id, command_type, payload INTO existing_id, existing_type, existing_payload
      FROM economic.command_intents
     WHERE mission_id = p_mission_id AND idempotency_key = p_idempotency_key;
    IF existing_type = p_command_type AND existing_payload = p_payload THEN
      RETURN existing_id;
    END IF;
    RAISE EXCEPTION 'idempotency conflict' USING ERRCODE = '23505';
END;
$$;

CREATE FUNCTION economic.submit_governance_intent(p_mission_id UUID, p_command_type TEXT, p_idempotency_key TEXT, p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = economic, pg_temp
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  existing_id UUID;
  existing_type TEXT;
  existing_payload JSONB;
BEGIN
  IF p_command_type NOT IN ('publish_rule', 'activate_rule') THEN
    RAISE EXCEPTION 'capability refused' USING ERRCODE = '42501';
  END IF;
  IF p_mission_id IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{1,200}$' OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid governance intent' USING ERRCODE = '22023';
  END IF;
  INSERT INTO economic.command_intents (
    id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitted_at, submitter_capability
  ) VALUES (
    new_id, p_mission_id, p_command_type, p_idempotency_key, 'process', 'rule-publisher', p_payload, clock_timestamp(), 'governance'
  );
  RETURN new_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id, command_type, payload INTO existing_id, existing_type, existing_payload
      FROM economic.command_intents
     WHERE mission_id = p_mission_id AND idempotency_key = p_idempotency_key;
    IF existing_type = p_command_type AND existing_payload = p_payload THEN
      RETURN existing_id;
    END IF;
    RAISE EXCEPTION 'idempotency conflict' USING ERRCODE = '23505';
END;
$$;

CREATE FUNCTION economic.submit_bounty_recognition_intent(p_mission_id UUID, p_idempotency_key TEXT, p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = economic, pg_temp
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  existing_id UUID;
  existing_payload JSONB;
BEGIN
  IF p_mission_id IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{1,200}$' OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid bounty recognition intent' USING ERRCODE = '22023';
  END IF;
  INSERT INTO economic.command_intents (
    id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitted_at, submitter_capability
  ) VALUES (
    new_id, p_mission_id, 'recognize_bounty_completion', p_idempotency_key, 'process', 'bounty-recognition', p_payload, clock_timestamp(), 'bounty_recognition'
  );
  RETURN new_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id, payload INTO existing_id, existing_payload
      FROM economic.command_intents
     WHERE mission_id = p_mission_id AND idempotency_key = p_idempotency_key;
    IF existing_payload = p_payload THEN
      RETURN existing_id;
    END IF;
    RAISE EXCEPTION 'idempotency conflict' USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION economic.submit_human_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_recognition_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_governance_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_bounty_recognition_intent(uuid, text, jsonb) FROM PUBLIC;
