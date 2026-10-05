-- Least privilege for the isolated recognition bridge. It never receives kernel-writer or signing authority.

GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_role";
GRANT USAGE ON SCHEMA public TO :"app_role";
REVOKE ALL ON TABLE mission_schema_migrations, human_accounts, missions, mission_revisions, mission_environment, projects, project_revisions, work_items, work_revisions, work_interests, work_invitations, work_confirmations, contributions, contributor_refs, contribution_recognitions, contribution_bridge_outcomes, contribution_anchors FROM :"app_role";
GRANT SELECT ON missions, projects, work_items, work_interests, work_invitations, work_confirmations, contributions, contributor_refs, contribution_recognitions, contribution_bridge_outcomes, contribution_anchors TO :"app_role";
GRANT INSERT ON contribution_bridge_outcomes, contribution_anchors TO :"app_role";
