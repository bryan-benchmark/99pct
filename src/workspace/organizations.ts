import { randomUUID } from "node:crypto";
import type { WorkspaceDb } from "./db/client";
import { consumeWorkspaceRateLimit } from "./rate-limit";

export type VerifiedIdentity = { uid: string; email: string };

export class WorkspaceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function createOrganization(db: WorkspaceDb, actor: VerifiedIdentity, proposedName: string) {
  const name = proposedName.trim();
  const email = actor.email.trim().toLowerCase();
  if (name.length < 2 || name.length > 160) throw new WorkspaceError(400, "Enter an organization name between 2 and 160 characters.");
  if (!actor.uid || actor.uid.length > 128 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new WorkspaceError(401, "A verified account is required.");
  const orgId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO workspace_users(id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [actor.uid, email]);
    const user = await tx.query<{ email: string }>("SELECT email FROM workspace_users WHERE id = $1", [actor.uid]);
    if (user.rows[0]?.email !== email) throw new WorkspaceError(409, "Account email changed; reverify identity before continuing.");
    await consumeWorkspaceRateLimit(tx, "organization_day", actor.uid);
    await tx.query("INSERT INTO organizations(id, name) VALUES ($1, $2)", [orgId, name]);
    await tx.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')", [orgId, actor.uid]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, payload) VALUES ($1, $2, $3, 'organization', $5, 'organization.created', $4)", [randomUUID(), orgId, actor.uid, JSON.stringify({ name }), orgId]);
  });
  return { id: orgId, name };
}

export async function getOrganizationForMember(db: WorkspaceDb, orgId: string, actorId: string) {
  const result = await db.query<{ id: string; name: string; role: string }>(
    "SELECT o.id, o.name, m.role FROM organizations o JOIN memberships m ON m.org_id = o.id WHERE o.id = $1 AND m.user_id = $2 AND m.status = 'active'",
    [orgId, actorId],
  );
  return result.rows[0] || null;
}

export async function listOrganizationsForMember(db: WorkspaceDb, actorId: string) {
  const result = await db.query<{ id: string; name: string; role: string }>(
    "SELECT o.id, o.name, m.role FROM organizations o JOIN memberships m ON m.org_id = o.id WHERE m.user_id = $1 AND m.status = 'active' ORDER BY o.created_at, o.id",
    [actorId],
  );
  return result.rows;
}
