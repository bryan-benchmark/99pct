ALTER TABLE workspace_environment
  ADD COLUMN firebase_project_id TEXT
  CHECK (firebase_project_id IS NULL OR length(firebase_project_id) BETWEEN 3 AND 128);
