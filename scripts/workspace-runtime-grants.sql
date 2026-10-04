-- Run with psql -v ON_ERROR_STOP=1 -v app_role=<existing_runtime_role> -f scripts/workspace-runtime-grants.sql
-- against a dedicated workspace database after migrations. The role must not own
-- the database, schema, tables, or migration function and must not inherit their owner role.
-- Create the LOGIN role and set its password outside this file via the database provider.

BEGIN;
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA public TO :"app_role";

REVOKE ALL ON TABLE workspace_schema_migrations, workspace_users, organizations,
  memberships, contract_revisions, decisions, decision_revisions, decision_reviews,
  audit_events, invitations, workspace_rate_limits, workspace_environment FROM :"app_role";

GRANT SELECT ON workspace_schema_migrations, workspace_environment TO :"app_role";
GRANT SELECT, INSERT ON workspace_users, contract_revisions, decisions,
  decision_revisions, decision_reviews, audit_events TO :"app_role";
GRANT SELECT, INSERT ON organizations TO :"app_role";
-- SELECT FOR UPDATE needs an UPDATE privilege. Only the UUID column is granted;
-- referenced organization IDs cannot be changed while dependent records exist.
GRANT UPDATE (id) ON organizations TO :"app_role";
GRANT SELECT, INSERT, UPDATE ON memberships, invitations, workspace_rate_limits TO :"app_role";
COMMIT;
