CREATE TABLE workspace_rate_limits (
  scope TEXT NOT NULL CHECK (scope IN ('session_hour', 'organization_day', 'invitation_day')),
  subject_hash TEXT NOT NULL CHECK (length(subject_hash) = 64),
  window_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (scope, subject_hash, window_start)
);
CREATE INDEX workspace_rate_limits_window ON workspace_rate_limits(window_start);
