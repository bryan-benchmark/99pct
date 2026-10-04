-- Disposable economic runtime grants. The role must already exist and must not own
-- the database, schema, or tables. Create the LOGIN role outside this file.
-- psql -v ON_ERROR_STOP=1 -v app_role=<runtime role> -d <disposable database>

BEGIN;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA economic TO :"app_role";
REVOKE ALL ON TABLE economic.schema_migrations, economic.commands, economic.events, economic.rule_versions, economic.reward_keys FROM :"app_role";
GRANT SELECT ON economic.schema_migrations TO :"app_role";
GRANT SELECT, INSERT ON economic.commands, economic.events, economic.rule_versions, economic.reward_keys TO :"app_role";
COMMIT;
