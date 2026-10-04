import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization, getOrganizationForMember } from "./organizations";

test("creation atomically records owner membership and audit event", async () => {
  const db = new PGlite();
  try {
    const workspaceDb = embeddedWorkspaceDb(db);
    await migrateWorkspace(workspaceDb);
    const org = await createOrganization(workspaceDb, { uid: "u1", email: " Owner@Example.Test " }, "  Acme Mission  ");
    assert.equal(org.name, "Acme Mission");
    assert.deepEqual(await getOrganizationForMember(workspaceDb, org.id, "u1"), { id: org.id, name: org.name, role: "owner" });
    assert.equal(await getOrganizationForMember(workspaceDb, org.id, "u2"), null);
    const audit = await db.query<{ action: string; actor_id: string }>("SELECT action, actor_id FROM audit_events WHERE org_id = $1", [org.id]);
    assert.deepEqual(audit.rows, [{ action: "organization.created", actor_id: "u1" }]);
    await assert.rejects(db.query("DELETE FROM audit_events WHERE org_id = $1", [org.id]));
  } finally {
    await db.close();
  }
});

test("invalid or inconsistent identity does not create an organization", async () => {
  const db = new PGlite();
  try {
    const workspaceDb = embeddedWorkspaceDb(db);
    await migrateWorkspace(workspaceDb);
    await assert.rejects(createOrganization(workspaceDb, { uid: "", email: "nope" }, "Valid name"));
    await createOrganization(workspaceDb, { uid: "u1", email: "one@example.test" }, "First org");
    await assert.rejects(createOrganization(workspaceDb, { uid: "u1", email: "other@example.test" }, "Second org"));
    const count = await db.query<{ total: number }>("SELECT count(*)::int AS total FROM organizations");
    assert.equal(count.rows[0]?.total, 1);
  } finally {
    await db.close();
  }
});
