import type { WorkspaceDb, WorkspaceSql } from "./db/client";
import { isDeepStrictEqual } from "node:util";

type Event = { org_seq: string; schema_version: number; object_type: string; object_id: string; action: string; revision: number | null; actor_id: string; payload: unknown };
type Expected = { objectType: string; objectId: string; action: string; revision: number | null; actorId?: string; invitationId?: string; payload?: Record<string, unknown> };
export type AuditIntegrityReport = { organizationsChecked: number; eventsChecked: number; issues: string[] };

function objectPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function eventKey(event: { objectType: string; objectId: string; action: string; revision: number | null; invitationId?: string }) {
  return JSON.stringify([event.objectType, event.objectId, event.action, event.revision, event.invitationId || null]);
}

async function checkOrganization(tx: WorkspaceSql, orgId: string): Promise<{ eventCount: number; issues: string[] }> {
  const org = await tx.query<{ id: string; name: string }>("SELECT id, name FROM organizations WHERE id = $1", [orgId]);
  const contracts = await tx.query<{ revision: number; author_id: string; status: string }>("SELECT revision, author_id, status FROM contract_revisions WHERE org_id = $1", [orgId]);
  const decisionRevisions = await tx.query<{ decision_id: string; revision: number; author_id: string; status: string }>("SELECT decision_id, revision, author_id, status FROM decision_revisions WHERE org_id = $1", [orgId]);
  const reviews = await tx.query<{ decision_id: string; revision: number; reviewer_id: string; disposition: string; reason: string; gates: unknown }>("SELECT decision_id, revision, reviewer_id, disposition, reason, gates FROM decision_reviews WHERE org_id = $1", [orgId]);
  const invitations = await tx.query<{ id: string; email: string; role: string; status: string; invited_by: string; accepted_by: string | null; expires_at: Date | string }>("SELECT id, email, role, status, invited_by, accepted_by, expires_at FROM invitations WHERE org_id = $1", [orgId]);
  const memberships = await tx.query<{ user_id: string; role: string; status: string }>("SELECT user_id, role, status FROM memberships WHERE org_id = $1", [orgId]);
  const audit = await tx.query<Event>("SELECT org_seq, schema_version, object_type, object_id, action, revision, actor_id, payload FROM audit_events WHERE org_id = $1 ORDER BY org_seq", [orgId]);
  const expected: Expected[] = [];
  if (org.rows[0]) expected.push({ objectType: "organization", objectId: orgId, action: "organization.created", revision: null, payload: { name: org.rows[0].name } });
  for (const row of contracts.rows) expected.push({ objectType: "contract", objectId: orgId, action: `contract.${row.status === "submitted" ? "submitted" : "drafted"}`, revision: row.revision, actorId: row.author_id, payload: { status: row.status } });
  for (const row of decisionRevisions.rows) expected.push({ objectType: "decision", objectId: row.decision_id, action: `decision.${row.status === "submitted" ? "submitted" : "drafted"}`, revision: row.revision, actorId: row.author_id, payload: { status: row.status } });
  for (const row of reviews.rows) expected.push({ objectType: "review", objectId: row.decision_id, action: `decision.${row.disposition}`, revision: row.revision, actorId: row.reviewer_id, payload: { reason: row.reason, ...(row.gates ? { gates: row.gates } : {}) } });
  for (const row of invitations.rows) {
    expected.push({ objectType: "invitation", objectId: row.id, action: "invitation.created", revision: null, actorId: row.invited_by, payload: { email: row.email, role: row.role, expiresAt: new Date(row.expires_at).toISOString() } });
    if (row.status === "revoked") expected.push({ objectType: "invitation", objectId: row.id, action: "invitation.revoked", revision: null });
    if (row.status === "accepted" && row.accepted_by) expected.push({ objectType: "membership", objectId: row.accepted_by, action: "membership.joined", revision: null, actorId: row.accepted_by, invitationId: row.id, payload: { invitationId: row.id, role: row.role } });
  }
  const issues: string[] = [];
  const expectedByKey = new Map<string, { record: Expected; matches: number }>();
  for (const record of expected) {
    const key = eventKey(record);
    if (expectedByKey.has(key)) issues.push(`${orgId}: duplicate source transition`);
    expectedByKey.set(key, { record, matches: 0 });
  }
  const memberIds = new Set(memberships.rows.map((row) => row.user_id));
  const memberState = new Map<string, { role: string; status: "active" | "revoked" }>();
  const invitationState = new Map<string, "pending" | "accepted" | "revoked">();
  let ownerId: string | null = null;
  let sequence = BigInt(1);
  for (const event of audit.rows) {
    if (String(event.org_seq) !== sequence.toString()) issues.push(`${orgId}: event sequence gap or disorder`);
    sequence += BigInt(1);
    if (event.schema_version !== 1) issues.push(`${orgId}: unknown event schema version`);
    const payload = objectPayload(event.payload);
    if (event.action === "organization.created") {
      if (ownerId || event.object_type !== "organization" || event.object_id !== orgId) issues.push(`${orgId}: invalid owner creation event`);
      else {
        ownerId = event.actor_id;
        memberState.set(ownerId, { role: "owner", status: "active" });
      }
    } else if (event.action === "invitation.created") {
      if (event.object_type !== "invitation" || invitationState.has(event.object_id) || event.actor_id !== ownerId) issues.push(`${orgId}: invalid invitation creation transition`);
      else invitationState.set(event.object_id, "pending");
    } else if (event.action === "membership.joined") {
      const invitationId = typeof payload.invitationId === "string" ? payload.invitationId : "";
      const previousMember = memberState.get(event.object_id);
      if (event.object_type !== "membership" || event.actor_id !== event.object_id || invitationState.get(invitationId) !== "pending" || previousMember?.status === "active" || (payload.role !== "editor" && payload.role !== "reviewer")) issues.push(`${orgId}: invalid membership join transition`);
      else {
        invitationState.set(invitationId, "accepted");
        memberState.set(event.object_id, { role: payload.role, status: "active" });
      }
    } else if (event.action === "invitation.revoked") {
      if (event.object_type !== "invitation" || event.actor_id !== ownerId || invitationState.get(event.object_id) !== "pending") issues.push(`${orgId}: invalid invitation revocation transition`);
      else invitationState.set(event.object_id, "revoked");
    } else if (event.action === "membership.revoked") {
      const previous = memberState.get(event.object_id);
      if (event.object_type !== "membership" || event.actor_id !== ownerId || previous?.status !== "active" || previous.role === "owner" || payload.role !== previous.role) issues.push(`${orgId}: invalid membership revocation transition`);
      else memberState.set(event.object_id, { role: previous.role, status: "revoked" });
    }
    if (event.action === "membership.revoked") {
      if (event.object_type !== "membership" || !memberIds.has(event.object_id) || (payload.role !== "editor" && payload.role !== "reviewer")) issues.push(`${orgId}: invalid membership revocation event`);
      continue;
    }
    const key = eventKey({ objectType: event.object_type, objectId: event.object_id, action: event.action, revision: event.revision, invitationId: event.action === "membership.joined" ? String(payload.invitationId || "") : undefined });
    const match = expectedByKey.get(key);
    if (!match || (match.record.actorId && event.actor_id !== match.record.actorId)) {
      issues.push(`${orgId}: extra or mismatched event`);
      continue;
    }
    match.matches += 1;
    if (match.record.payload && Object.entries(match.record.payload).some(([field, value]) => !isDeepStrictEqual(payload[field], value))) issues.push(`${orgId}: event payload differs from source`);
  }
  for (const { matches } of expectedByKey.values()) if (matches !== 1) issues.push(`${orgId}: source transition has ${matches} matching events`);
  for (const row of memberships.rows) {
    const replayed = memberState.get(row.user_id);
    if (!replayed || replayed.role !== row.role || replayed.status !== row.status) issues.push(`${orgId}: membership state differs from events`);
  }
  for (const userId of memberState.keys()) if (!memberIds.has(userId)) issues.push(`${orgId}: event member has no membership row`);
  const invitationIds = new Set(invitations.rows.map((row) => row.id));
  for (const row of invitations.rows) if (invitationState.get(row.id) !== row.status) issues.push(`${orgId}: invitation state differs from events`);
  for (const invitationId of invitationState.keys()) if (!invitationIds.has(invitationId)) issues.push(`${orgId}: event invitation has no invitation row`);
  return { eventCount: audit.rows.length, issues };
}

export async function checkWorkspaceAuditIntegrity(db: WorkspaceDb): Promise<AuditIntegrityReport> {
  const organizations = await db.query<{ id: string }>("SELECT id FROM organizations ORDER BY id");
  const report: AuditIntegrityReport = { organizationsChecked: 0, eventsChecked: 0, issues: [] };
  for (const organization of organizations.rows) {
    const result = await db.transaction(async (tx) => {
      await tx.exec("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
      return checkOrganization(tx, organization.id);
    });
    report.organizationsChecked += 1;
    report.eventsChecked += result.eventCount;
    report.issues.push(...result.issues);
  }
  return report;
}
