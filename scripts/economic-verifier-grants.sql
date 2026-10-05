-- Read-only verifier role for a disposable economic database.
-- psql -v ON_ERROR_STOP=1 -v app_role=<verifier role> -d <disposable database>

BEGIN;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA economic TO :"app_role";
REVOKE ALL ON TABLE economic.schema_migrations, economic.command_intents, economic.commands, economic.events, economic.rule_versions, economic.reward_keys FROM :"app_role";
GRANT SELECT ON economic.schema_migrations, economic.command_intents, economic.commands, economic.events, economic.rule_versions, economic.reward_keys TO :"app_role";
COMMIT;
