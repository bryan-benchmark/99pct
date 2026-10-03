import type { WorkspaceDb, WorkspaceSql } from "./db/client";
import { WorkspaceError } from "./organizations";

export type WorkspaceRole = "owner" | "editor" | "reviewer";
export type WorkspacePermission = "read" | "manage_members" | "edit_contract" | "propose_decision" | "review_decision" | "export_audit";

const permissions: Record<WorkspaceRole, readonly WorkspacePermission[]> = {
  owner: ["read", "manage_members", "edit_contract", "propose_decision", "review_decision", "export_audit"],
  editor: ["read", "propose_decision", "export_audit"],
  reviewer: ["read", "review_decision", "export_audit"],
};

export async function requireWorkspacePermission(db: WorkspaceSql, orgId: string, actorId: string, permission: WorkspacePermission): Promise<WorkspaceRole> {
  const result = await db.query<{ role: WorkspaceRole }>(
    "SELECT role FROM memberships WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
    [orgId, actorId],
  );
  const role = result.rows[0]?.role;
  if (!role) throw new WorkspaceError(404, "Workspace not found.");
  if (!permissions[role]?.includes(permission)) throw new WorkspaceError(403, "Your role cannot perform this action.");
  return role;
}

export async function readWorkspaceSnapshot<T>(db: WorkspaceDb, orgId: string, actorId: string, permission: WorkspacePermission, read: (tx: WorkspaceSql) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireWorkspacePermission(tx, orgId, actorId, permission);
    return read(tx);
  });
}

export async function requireIndependentReviewer(db: WorkspaceSql, orgId: string, reviewerId: string, decisionId: string, revision: number) {
  await requireWorkspacePermission(db, orgId, reviewerId, "review_decision");
  const result = await db.query<{ author_id: string; status: string }>(
    "SELECT author_id, status FROM decision_revisions WHERE org_id = $1 AND decision_id = $2 AND revision = $3",
    [orgId, decisionId, revision],
  );
  const proposal = result.rows[0];
  if (!proposal) throw new WorkspaceError(404, "Decision revision not found.");
  if (proposal.status !== "submitted") throw new WorkspaceError(409, "Only a submitted revision can be reviewed.");
  if (reviewerId === proposal.author_id) throw new WorkspaceError(403, "A proposal needs a different reviewer.");
}
