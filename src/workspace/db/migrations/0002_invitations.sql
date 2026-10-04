ALTER TABLE audit_events DROP CONSTRAINT audit_events_object_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_object_type_check
  CHECK (object_type IN ('organization', 'membership', 'invitation', 'contract', 'decision', 'review'));

CREATE TABLE invitations (
  org_id UUID NOT NULL REFERENCES organizations(id),
  id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  email TEXT NOT NULL CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 320),
  role TEXT NOT NULL CHECK (role IN ('editor', 'reviewer')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by TEXT NOT NULL,
  accepted_by TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, invited_by) REFERENCES memberships(org_id, user_id),
  FOREIGN KEY (org_id, accepted_by) REFERENCES memberships(org_id, user_id),
  CHECK ((status = 'accepted') = (accepted_by IS NOT NULL AND accepted_at IS NOT NULL)),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);
CREATE INDEX invitations_org_status ON invitations(org_id, status, created_at);
CREATE INDEX invitations_org_email ON invitations(org_id, email);
