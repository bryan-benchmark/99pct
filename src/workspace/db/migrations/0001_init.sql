CREATE TABLE workspace_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(id) BETWEEN 1 AND 128),
  CHECK (length(email) BETWEEN 3 AND 320)
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(trim(name)) BETWEEN 2 AND 160)
);

CREATE TABLE memberships (
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES workspace_users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer')),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE contract_revisions (
  org_id UUID NOT NULL REFERENCES organizations(id),
  revision INTEGER NOT NULL CHECK (revision > 0),
  author_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, revision),
  FOREIGN KEY (org_id, author_id) REFERENCES memberships(org_id, user_id)
);

CREATE TABLE decisions (
  org_id UUID NOT NULL REFERENCES organizations(id),
  id UUID NOT NULL,
  contract_revision INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, contract_revision) REFERENCES contract_revisions(org_id, revision),
  FOREIGN KEY (org_id, created_by) REFERENCES memberships(org_id, user_id)
);

CREATE TABLE decision_revisions (
  org_id UUID NOT NULL,
  decision_id UUID NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  author_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, decision_id, revision),
  FOREIGN KEY (org_id, decision_id) REFERENCES decisions(org_id, id),
  FOREIGN KEY (org_id, author_id) REFERENCES memberships(org_id, user_id)
);

CREATE TABLE decision_reviews (
  org_id UUID NOT NULL,
  decision_id UUID NOT NULL,
  revision INTEGER NOT NULL,
  reviewer_id TEXT NOT NULL,
  disposition TEXT NOT NULL CHECK (disposition IN ('approved', 'rejected')),
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, decision_id, revision),
  FOREIGN KEY (org_id, decision_id, revision) REFERENCES decision_revisions(org_id, decision_id, revision),
  FOREIGN KEY (org_id, reviewer_id) REFERENCES memberships(org_id, user_id)
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  actor_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('organization', 'membership', 'contract', 'decision', 'review')),
  object_id TEXT NOT NULL,
  action TEXT NOT NULL,
  revision INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (org_id, actor_id) REFERENCES memberships(org_id, user_id)
);
CREATE INDEX audit_events_org_time ON audit_events(org_id, occurred_at, id);

CREATE FUNCTION reject_workspace_history_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Workspace history is append only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_revisions_immutable BEFORE UPDATE OR DELETE ON contract_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_workspace_history_change();
CREATE TRIGGER decision_revisions_immutable BEFORE UPDATE OR DELETE ON decision_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_workspace_history_change();
CREATE TRIGGER decision_reviews_immutable BEFORE UPDATE OR DELETE ON decision_reviews
  FOR EACH ROW EXECUTE FUNCTION reject_workspace_history_change();
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_workspace_history_change();
