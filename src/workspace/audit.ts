import { createHash } from "node:crypto";
import { readWorkspaceSnapshot, requireWorkspacePermission } from "./access";
import type { WorkspaceDb } from "./db/client";
import { WorkspaceError } from "./organizations";

export type AuditEvent = { id: string; org_seq: string; sequence_backfilled: boolean; actor_id: string; actor_email: string; object_type: string; object_id: string; action: string; revision: number | null; payload: unknown; schema_version: number; occurred_at: Date | string };

export async function listAuditEvents(db: WorkspaceDb, orgId: string, actorId: string): Promise<AuditEvent[]> {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const result = await tx.query<AuditEvent>("SELECT e.id, e.org_seq, e.sequence_backfilled, e.actor_id, u.email AS actor_email, e.object_type, e.object_id, e.action, e.revision, e.payload, e.schema_version, e.occurred_at FROM audit_events e JOIN workspace_users u ON u.id = e.actor_id WHERE e.org_id = $1 ORDER BY e.org_seq", [orgId]);
    return result.rows;
  });
}

export async function exportOrganizationRecord(db: WorkspaceDb, orgId: string, actorId: string) {
  return db.transaction(async (tx) => {
    await tx.exec("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireWorkspacePermission(tx, orgId, actorId, "export_audit");
    const organization = await tx.query<{ id: string; name: string; created_at: Date | string }>("SELECT id, name, created_at FROM organizations WHERE id = $1", [orgId]);
    if (!organization.rows[0]) throw new WorkspaceError(404, "Workspace not found.");
    const members = await tx.query<{ user_id: string; email: string; role: string; status: string; created_at: Date | string }>("SELECT m.user_id, u.email, m.role, m.status, m.created_at FROM memberships m JOIN workspace_users u ON u.id = m.user_id WHERE m.org_id = $1 ORDER BY m.created_at, m.user_id", [orgId]);
    const invitations = await tx.query<{ id: string; email: string; role: string; status: string; invited_by: string; accepted_by: string | null; expires_at: Date | string; created_at: Date | string; accepted_at: Date | string | null; revoked_at: Date | string | null }>("SELECT id, email, role, status, invited_by, accepted_by, expires_at, created_at, accepted_at, revoked_at FROM invitations WHERE org_id = $1 ORDER BY created_at, id", [orgId]);
    const contracts = await tx.query("SELECT revision, author_id, status, answers, created_at FROM contract_revisions WHERE org_id = $1 ORDER BY revision", [orgId]);
    const decisions = await tx.query("SELECT id, contract_revision, created_by, created_at FROM decisions WHERE org_id = $1 ORDER BY created_at, id", [orgId]);
    const decisionRevisions = await tx.query("SELECT decision_id, revision, author_id, status, content, created_at FROM decision_revisions WHERE org_id = $1 ORDER BY decision_id, revision", [orgId]);
    const reviews = await tx.query("SELECT decision_id, revision, reviewer_id, disposition, reason, gates, created_at FROM decision_reviews WHERE org_id = $1 ORDER BY decision_id, revision", [orgId]);
    const events = await tx.query("SELECT id, org_seq, sequence_backfilled, actor_id, object_type, object_id, action, revision, payload, schema_version, occurred_at FROM audit_events WHERE org_id = $1 ORDER BY org_seq", [orgId]);
    const data = {
      exportSchemaVersion: 2,
      generatedAt: new Date().toISOString(),
      organization: organization.rows[0],
      members: members.rows,
      invitations: invitations.rows,
      contractRevisions: contracts.rows,
      decisions: decisions.rows,
      decisionRevisions: decisionRevisions.rows,
      decisionReviews: reviews.rows,
      auditEvents: events.rows,
    };
    const sha256 = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    return { ...data, checksum: { algorithm: "sha256" as const, value: sha256, covers: "JSON.stringify(export without checksum)" } };
  });
}
