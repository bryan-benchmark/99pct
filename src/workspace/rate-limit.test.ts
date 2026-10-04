import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { consumeWorkspaceRateLimit } from "./rate-limit";
import { createOrganization } from "./organizations";
import { createInvitation, revokeInvitation } from "./invitations";

test("verified session exchanges have an atomic hourly account quota and a new window resets it", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const results = await Promise.allSettled(Array.from({ length: 35 }, () => consumeWorkspaceRateLimit(db, "session_hour", "account-a")));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 30);
    assert.equal(results.filter((result) => result.status === "rejected" && result.reason?.status === 429).length, 5);
    assert.equal(await consumeWorkspaceRateLimit(db, "session_hour", "account-b"), 1);
    const stored = await db.query<{ attempts: number }>("SELECT attempts FROM workspace_rate_limits WHERE scope = 'session_hour' ORDER BY attempts DESC");
    assert.deepEqual(stored.rows.map((row) => row.attempts), [30, 1]);
    await db.query("UPDATE workspace_rate_limits SET window_start = window_start - interval '1 hour' WHERE scope = 'session_hour'");
    assert.equal(await consumeWorkspaceRateLimit(db, "session_hour", "account-a"), 1);
  } finally { await embedded.close(); }
});

test("organization and invitation quotas stop repeated successful actions without partial audit records", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const actor = { uid: "owner", email: "owner@example.test" };
    const organizations = [];
    for (let index = 0; index < 5; index += 1) organizations.push(await createOrganization(db, actor, `Org ${index}`));
    await assert.rejects(createOrganization(db, actor, "Overflow org"), { status: 429 });
    const ownerCount = await db.query<{ total: number }>("SELECT count(*)::int AS total FROM organizations");
    assert.equal(ownerCount.rows[0]?.total, 5);
    const orgId = organizations[0].id;
    for (let index = 0; index < 30; index += 1) {
      const invitation = await createInvitation(db, orgId, actor.uid, `person${index}@example.test`, "reviewer");
      await revokeInvitation(db, orgId, actor.uid, invitation.id);
    }
    await assert.rejects(createInvitation(db, orgId, actor.uid, "overflow@example.test", "reviewer"), { status: 429 });
    const counts = await db.query<{ invitations: number; created_events: number }>(
      "SELECT (SELECT count(*)::int FROM invitations WHERE org_id = $1) AS invitations, (SELECT count(*)::int FROM audit_events WHERE org_id = $1 AND action = 'invitation.created') AS created_events", [orgId],
    );
    assert.deepEqual(counts.rows[0], { invitations: 30, created_events: 30 });
  } finally { await embedded.close(); }
});
