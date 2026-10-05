-- Read-only economic verifier.
-- psql -v ON_ERROR_STOP=1 -v app_role=<verifier role> -d <database>

BEGIN;
REVOKE ALL ON FUNCTION economic.submit_human_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_recognition_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_governance_intent(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION economic.submit_bounty_recognition_intent(uuid, text, jsonb) FROM PUBLIC;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA economic TO :"app_role";
REVOKE ALL ON TABLE economic.schema_migrations, economic.command_intents, economic.intent_outcomes, economic.commands, economic.events, economic.rule_versions, economic.reward_keys FROM :"app_role";
GRANT SELECT ON economic.schema_migrations, economic.command_intents, economic.intent_outcomes, economic.commands, economic.events, economic.rule_versions, economic.reward_keys TO :"app_role";
REVOKE ALL ON FUNCTION economic.submit_human_intent(uuid, text, text, jsonb) FROM :"app_role";
REVOKE ALL ON FUNCTION economic.submit_recognition_intent(uuid, text, text, jsonb) FROM :"app_role";
REVOKE ALL ON FUNCTION economic.submit_governance_intent(uuid, text, text, jsonb) FROM :"app_role";
REVOKE ALL ON FUNCTION economic.submit_bounty_recognition_intent(uuid, text, jsonb) FROM :"app_role";
COMMIT;
