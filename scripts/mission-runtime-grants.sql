-- Run with psql -v ON_ERROR_STOP=1 -v app_role=<existing_runtime_role> -f scripts/mission-runtime-grants.sql
-- against a dedicated Mission database after migrations. The role must not own
-- the database, schema, or tables and must not inherit the migration role.
-- Create the LOGIN role and set its password outside this file.

BEGIN;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA public TO :"app_role";

REVOKE ALL ON TABLE mission_schema_migrations, human_accounts, missions, mission_revisions, mission_environment, projects, project_revisions, work_items, work_revisions FROM :"app_role";

GRANT SELECT ON mission_schema_migrations, mission_environment TO :"app_role";
GRANT SELECT, INSERT ON human_accounts, missions, mission_revisions, projects, project_revisions, work_items, work_revisions TO :"app_role";
GRANT UPDATE (verified_email) ON human_accounts TO :"app_role";
COMMIT;
