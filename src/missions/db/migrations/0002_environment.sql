CREATE TABLE mission_environment (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  release_target TEXT NOT NULL CHECK (release_target IN ('staging', 'production')),
  firebase_project_id TEXT NOT NULL CHECK (length(firebase_project_id) BETWEEN 3 AND 128),
  database_name TEXT NOT NULL CHECK (length(database_name) BETWEEN 1 AND 63),
  instance_connection_name TEXT NOT NULL CHECK (length(instance_connection_name) BETWEEN 8 AND 220),
  bound_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
