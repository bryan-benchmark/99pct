import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readWorkspaceSnapshot, requireWorkspacePermission, type WorkspaceRole } from "./access";
import type { WorkspaceDb } from "./db/client";
import { WorkspaceError, type VerifiedIdentity } from "./organizations";
import { consumeWorkspaceRateLimit } from "./rate-limit";

export const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;
export const maxPendingInvitationsPerOrganization = 25;

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || normalized.length > 320) throw new WorkspaceError(400, "Enter a valid email address.");
  return normalized;
}

function tokenHash(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new WorkspaceError(404, "Invitation not found.");
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(db: WorkspaceDb, orgId: string, actorId: string, emailInput: string, role: "editor" | "reviewer") {
  const email = normalizeEmail(emailInput);
  if (role !== "editor" && role !== "reviewer") throw new WorkspaceError(400, "Choose editor or reviewer.");
  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + invitationLifetimeMs);
  await db.transaction(async (tx) => {
    const org = await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    if (!org.rows.length) throw new WorkspaceError(404, "Workspace not found.");
    await requireWorkspacePermission(tx, orgId, actorId, "manage_members");
    const existing = await tx.query("SELECT 1 FROM memberships m JOIN workspace_users u ON u.id = m.user_id WHERE m.org_id = $1 AND u.email = $2 AND m.status = 'active'", [orgId, email]);
    if (existing.rows.length) throw new WorkspaceError(409, "That person is already a member.");
    const pending = await tx.query("SELECT 1 FROM invitations WHERE org_id = $1 AND email = $2 AND status = 'pending' AND expires_at > now()", [orgId, email]);
    if (pending.rows.length) throw new WorkspaceError(409, "An active invitation already exists for that email.");
    const count = await tx.query<{ total: number }>("SELECT count(*)::int AS total FROM invitations WHERE org_id = $1 AND status = 'pending' AND expires_at > now()", [orgId]);
    if ((count.rows[0]?.total || 0) >= maxPendingInvitationsPerOrganization) throw new WorkspaceError(429, "Too many pending invitations. Revoke an unused link before creating another.");
    await consumeWorkspaceRateLimit(tx, "invitation_day", actorId);
    await tx.query("INSERT INTO invitations(org_id, id, token_hash, email, role, status, invited_by, expires_at) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)", [orgId, id, tokenHash(token), email, role, actorId, expiresAt]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, payload) VALUES ($1, $2, $3, 'invitation', $4, 'invitation.created', $5)", [randomUUID(), orgId, actorId, id, JSON.stringify({ email, role, expiresAt: expiresAt.toISOString() })]);
  });
  return { id, token, expiresAt: expiresAt.toISOString() };
}

export async function getInvitationForRecipient(db: WorkspaceDb, token: string, actor: VerifiedIdentity) {
  const result = await db.query<{ id: string; org_id: string; org_name: string; role: "editor" | "reviewer"; expires_at: Date | string; status: string }>(
    "SELECT i.id, i.org_id, o.name AS org_name, i.role, i.expires_at, i.status FROM invitations i JOIN organizations o ON o.id = i.org_id WHERE i.token_hash = $1 AND i.email = $2",
    [tokenHash(token), normalizeEmail(actor.email)],
  );
  const invitation = result.rows[0];
  if (!invitation || invitation.status !== "pending" || new Date(invitation.expires_at).getTime() <= Date.now()) throw new WorkspaceError(404, "Invitation not found or expired.");
  return invitation;
}

export async function acceptInvitation(db: WorkspaceDb, token: string, actor: VerifiedIdentity) {
  const hash = tokenHash(token);
  const email = normalizeEmail(actor.email);
  if (!actor.uid || actor.uid.length > 128) throw new WorkspaceError(401, "A verified account is required.");
  return db.transaction(async (tx) => {
    const row = await tx.query<{ id: string; org_id: string; role: "editor" | "reviewer"; email: string; status: string; expires_at: Date | string }>("SELECT id, org_id, role, email, status, expires_at FROM invitations WHERE token_hash = $1", [hash]);
    const invitation = row.rows[0];
    if (!invitation || invitation.email !== email) throw new WorkspaceError(404, "Invitation not found.");
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [invitation.org_id]);
    const current = await tx.query<{ status: string }>("SELECT status FROM invitations WHERE org_id = $1 AND id = $2 FOR UPDATE", [invitation.org_id, invitation.id]);
    if (current.rows[0]?.status !== "pending" || new Date(invitation.expires_at).getTime() <= Date.now()) throw new WorkspaceError(409, "Invitation is no longer active.");
    const linkedEmail = await tx.query<{ id: string }>("SELECT id FROM workspace_users WHERE email = $1", [email]);
    if (linkedEmail.rows[0] && linkedEmail.rows[0].id !== actor.uid) throw new WorkspaceError(409, "This email is already linked to a different account.");
    await tx.query("INSERT INTO workspace_users(id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [actor.uid, email]);
    const user = await tx.query<{ email: string }>("SELECT email FROM workspace_users WHERE id = $1", [actor.uid]);
    if (user.rows[0]?.email !== email) throw new WorkspaceError(409, "Account email changed; reverify identity before continuing.");
    const existing = await tx.query<{ user_id: string; status: string }>("SELECT m.user_id, m.status FROM memberships m JOIN workspace_users u ON u.id = m.user_id WHERE m.org_id = $1 AND u.email = $2", [invitation.org_id, email]);
    if (existing.rows.some((member) => member.status === "active")) throw new WorkspaceError(409, "You are already a member.");
    if (existing.rows.some((member) => member.user_id !== actor.uid)) throw new WorkspaceError(409, "This email is already linked to a different account.");
    if (existing.rows.length) await tx.query("UPDATE memberships SET role = $3, status = 'active' WHERE org_id = $1 AND user_id = $2", [invitation.org_id, actor.uid, invitation.role]);
    else await tx.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, $2, $3, 'active')", [invitation.org_id, actor.uid, invitation.role]);
    await tx.query("UPDATE invitations SET status = 'accepted', accepted_by = $3, accepted_at = now() WHERE org_id = $1 AND id = $2", [invitation.org_id, invitation.id, actor.uid]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, payload) VALUES ($1, $2, $3, 'membership', $4, 'membership.joined', $5)", [randomUUID(), invitation.org_id, actor.uid, actor.uid, JSON.stringify({ invitationId: invitation.id, role: invitation.role })]);
    return { orgId: invitation.org_id, role: invitation.role };
  });
}

export async function listOrganizationMembers(db: WorkspaceDb, orgId: string, actorId: string) {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const result = await tx.query<{ user_id: string; email: string; role: WorkspaceRole; status: string }>("SELECT m.user_id, u.email, m.role, m.status FROM memberships m JOIN workspace_users u ON u.id = m.user_id WHERE m.org_id = $1 ORDER BY u.email", [orgId]);
    return result.rows;
  });
}

export async function listPendingInvitations(db: WorkspaceDb, orgId: string, actorId: string) {
  return readWorkspaceSnapshot(db, orgId, actorId, "manage_members", async (tx) => {
    const result = await tx.query<{ id: string; email: string; role: "editor" | "reviewer"; expires_at: Date | string }>("SELECT id, email, role, expires_at FROM invitations WHERE org_id = $1 AND status = 'pending' AND expires_at > now() ORDER BY created_at, id", [orgId]);
    return result.rows;
  });
}

export async function revokeInvitation(db: WorkspaceDb, orgId: string, actorId: string, invitationId: string) {
  await db.transaction(async (tx) => {
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    await requireWorkspacePermission(tx, orgId, actorId, "manage_members");
    const invitation = await tx.query<{ status: string }>("SELECT status FROM invitations WHERE org_id = $1 AND id = $2 FOR UPDATE", [orgId, invitationId]);
    if (!invitation.rows[0] || invitation.rows[0].status !== "pending") throw new WorkspaceError(404, "Active invitation not found.");
    await tx.query("UPDATE invitations SET status = 'revoked', revoked_at = now() WHERE org_id = $1 AND id = $2", [orgId, invitationId]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action) VALUES ($1, $2, $3, 'invitation', $4, 'invitation.revoked')", [randomUUID(), orgId, actorId, invitationId]);
  });
}

export async function revokeMember(db: WorkspaceDb, orgId: string, actorId: string, memberId: string) {
  if (actorId === memberId) throw new WorkspaceError(400, "You cannot revoke your own access.");
  await db.transaction(async (tx) => {
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    await requireWorkspacePermission(tx, orgId, actorId, "manage_members");
    const member = await tx.query<{ role: WorkspaceRole; status: string }>("SELECT role, status FROM memberships WHERE org_id = $1 AND user_id = $2 FOR UPDATE", [orgId, memberId]);
    if (!member.rows[0] || member.rows[0].status !== "active") throw new WorkspaceError(404, "Active member not found.");
    if (member.rows[0].role === "owner") throw new WorkspaceError(403, "An owner cannot be revoked here.");
    await tx.query("UPDATE memberships SET status = 'revoked' WHERE org_id = $1 AND user_id = $2", [orgId, memberId]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, payload) VALUES ($1, $2, $3, 'membership', $4, 'membership.revoked', $5)", [randomUUID(), orgId, actorId, memberId, JSON.stringify({ role: member.rows[0].role })]);
  });
}
