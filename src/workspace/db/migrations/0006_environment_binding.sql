CREATE TABLE workspace_environment (
  singleton SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton = 1),
  target TEXT NOT NULL CHECK (target IN ('staging', 'production')),
  bound_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
