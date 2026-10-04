import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization } from "./organizations";
import { acceptInvitation, createInvitation, getInvitationForRecipient, listOrganizationMembers, maxPendingInvitationsPerOrganization, revokeInvitation, revokeMember } from "./invitations";

test("email-bound invitation grants reviewer access once and records membership history", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Test org");
    const invite = await createInvitation(db, org.id, "owner", " Reviewer@Example.Test ", "reviewer");
    const stored = await embedded.query<{ token_hash: string; email: string }>("SELECT token_hash, email FROM invitations WHERE org_id = $1", [org.id]);
    assert.equal(stored.rows[0]?.email, "reviewer@example.test");
    assert.notEqual(stored.rows[0]?.token_hash, invite.token);
    await assert.rejects(getInvitationForRecipient(db, invite.token, { uid: "wrong", email: "wrong@example.test" }), { status: 404 });
    await assert.rejects(acceptInvitation(db, invite.token, { uid: "wrong", email: "wrong@example.test" }), { status: 404 });
    assert.equal((await getInvitationForRecipient(db, invite.token, { uid: "reviewer", email: "reviewer@example.test" })).org_id, org.id);
    assert.deepEqual(await acceptInvitation(db, invite.token, { uid: "reviewer", email: "reviewer@example.test" }), { orgId: org.id, role: "reviewer" });
    await assert.rejects(acceptInvitation(db, invite.token, { uid: "reviewer", email: "reviewer@example.test" }), { status: 409 });
    assert.deepEqual((await listOrganizationMembers(db, org.id, "owner")).map((m) => [m.email, m.role, m.status]), [["owner@example.test", "owner", "active"], ["reviewer@example.test", "reviewer", "active"]]);
    const audit = await embedded.query<{ action: string }>("SELECT action FROM audit_events WHERE org_id = $1 ORDER BY occurred_at", [org.id]);
    assert.deepEqual(new Set(audit.rows.map((r) => r.action)), new Set(["organization.created", "invitation.created", "membership.joined"]));
    await revokeMember(db, org.id, "owner", "reviewer");
    assert.equal((await listOrganizationMembers(db, org.id, "owner"))[1]?.status, "revoked");
    const renewed = await createInvitation(db, org.id, "owner", "reviewer@example.test", "reviewer");
    await acceptInvitation(db, renewed.token, { uid: "reviewer", email: "reviewer@example.test" });
    assert.equal((await listOrganizationMembers(db, org.id, "owner"))[1]?.status, "active");
  } finally {
    await embedded.close();
  }
});

test("owner cannot accumulate unbounded pending invitation links", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Limited org");
    for (let index = 0; index < maxPendingInvitationsPerOrganization; index += 1) {
      await createInvitation(db, org.id, "owner", `person${index}@example.test`, "reviewer");
    }
    await assert.rejects(createInvitation(db, org.id, "owner", "overflow@example.test", "reviewer"), { status: 429 });
    const count = await embedded.query<{ total: number }>("SELECT count(*)::int AS total FROM invitations WHERE org_id = $1", [org.id]);
    assert.equal(count.rows[0]?.total, maxPendingInvitationsPerOrganization);
  } finally { await embedded.close(); }
});

test("invitation permissions, duplicate detection, expiry, and revocation failures preserve state", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const one = await createOrganization(db, { uid: "owner1", email: "one@example.test" }, "First org");
    const two = await createOrganization(db, { uid: "owner2", email: "two@example.test" }, "Second org");
    await assert.rejects(createInvitation(db, one.id, "owner2", "new@example.test", "reviewer"), { status: 404 });
    await assert.rejects(createInvitation(db, one.id, "owner1", "bad-email", "reviewer"), { status: 400 });
    const invite = await createInvitation(db, one.id, "owner1", "new@example.test", "reviewer");
    await assert.rejects(createInvitation(db, one.id, "owner1", "new@example.test", "editor"), { status: 409 });
    await revokeInvitation(db, one.id, "owner1", invite.id);
    await assert.rejects(acceptInvitation(db, invite.token, { uid: "new", email: "new@example.test" }), { status: 409 });
    await assert.rejects(revokeInvitation(db, one.id, "owner1", invite.id), { status: 404 });
    const replacement = await createInvitation(db, one.id, "owner1", "new@example.test", "reviewer");
    await assert.rejects(revokeMember(db, one.id, "owner1", "owner1"), { status: 400 });
    await assert.rejects(revokeMember(db, two.id, "owner1", "owner2"), { status: 404 });
    await embedded.query("UPDATE invitations SET expires_at = now() - interval '1 second' WHERE org_id = $1 AND id = $2", [one.id, replacement.id]);
    await assert.rejects(acceptInvitation(db, replacement.token, { uid: "new", email: "new@example.test" }), { status: 409 });
    const count = await embedded.query<{ members: number; joined: number }>("SELECT (SELECT count(*)::int FROM memberships WHERE org_id = $1) AS members, (SELECT count(*)::int FROM audit_events WHERE org_id = $1 AND action = 'membership.joined') AS joined", [one.id]);
    assert.deepEqual(count.rows[0], { members: 1, joined: 0 });
  } finally {
    await embedded.close();
  }
});
