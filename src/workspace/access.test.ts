import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization, WorkspaceError } from "./organizations";
import { requireIndependentReviewer, requireWorkspacePermission } from "./access";

test("active tenant membership controls actions and review needs a different actor", async () => {
  const embedded = new PGlite();
  const db = embeddedWorkspaceDb(embedded);
  try {
    await migrateWorkspace(db);
    const first = await createOrganization(db, { uid: "owner1", email: "one@example.test" }, "First org");
    const second = await createOrganization(db, { uid: "owner2", email: "two@example.test" }, "Second org");
    await db.query("INSERT INTO workspace_users(id, email) VALUES ('editor', 'editor@example.test'), ('reviewer', 'reviewer@example.test')");
    await db.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'editor', 'editor', 'active'), ($1, 'reviewer', 'reviewer', 'active')", [first.id]);
    const decisionId = "32f76909-7acf-48c1-9224-4747b70b5e12";
    await db.query("INSERT INTO contract_revisions(org_id, revision, author_id, status, answers) VALUES ($1, 1, 'owner1', 'submitted', '{}')", [first.id]);
    await db.query("INSERT INTO decisions(org_id, id, contract_revision, created_by) VALUES ($1, $2, 1, 'owner1')", [first.id, decisionId]);
    await db.query("INSERT INTO decision_revisions(org_id, decision_id, revision, author_id, status, content) VALUES ($1, $2, 1, 'owner1', 'submitted', '{}')", [first.id, decisionId]);
    assert.equal(await requireWorkspacePermission(db, first.id, "editor", "propose_decision"), "editor");
    await assert.rejects(requireWorkspacePermission(db, first.id, "editor", "review_decision"), (error: unknown) => error instanceof WorkspaceError && error.status === 403);
    await assert.rejects(requireWorkspacePermission(db, second.id, "editor", "read"), (error: unknown) => error instanceof WorkspaceError && error.status === 404);
    await assert.rejects(requireIndependentReviewer(db, first.id, "owner1", decisionId, 1), (error: unknown) => error instanceof WorkspaceError && error.status === 403);
    await requireIndependentReviewer(db, first.id, "reviewer", decisionId, 1);
    await db.query("UPDATE memberships SET status = 'revoked' WHERE org_id = $1 AND user_id = 'reviewer'", [first.id]);
    await assert.rejects(requireWorkspacePermission(db, first.id, "reviewer", "read"), (error: unknown) => error instanceof WorkspaceError && error.status === 404);
  } finally {
    await embedded.close();
  }
});
