-- Application-facing economic role. It may submit a command intent only.
-- It cannot insert authoritative commands, events, rule versions, or reward keys.
-- psql -v ON_ERROR_STOP=1 -v app_role=<application role> -d <disposable database>

BEGIN;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA economic TO :"app_role";
REVOKE ALL ON TABLE economic.schema_migrations, economic.command_intents, economic.commands, economic.events, economic.rule_versions, economic.reward_keys FROM :"app_role";
GRANT SELECT ON economic.schema_migrations, economic.command_intents, economic.commands, economic.events, economic.rule_versions, economic.reward_keys TO :"app_role";
GRANT INSERT ON economic.command_intents TO :"app_role";
COMMIT;
