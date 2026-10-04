import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization } from "./organizations";
import { contractQuestions, getContractRevision, getContractRevisions, parseContractAnswers, saveContractRevision } from "./contracts";

const answers = Object.fromEntries(Object.keys(contractQuestions).map((key) => [key, `Answer for ${key}`])) as ReturnType<typeof parseContractAnswers>;

test("contract revisions persist with matching audit events and immutable history", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Example mission");
    assert.deepEqual(await saveContractRevision(db, org.id, "owner", 0, "draft", answers), { revision: 1, status: "draft" });
    const revised = { ...answers, measure: "At least 100 people served each month" };
    assert.deepEqual(await saveContractRevision(db, org.id, "owner", 1, "submitted", revised), { revision: 2, status: "submitted" });
    const history = await getContractRevisions(db, org.id, "owner");
    assert.deepEqual(history.map((item) => [item.revision, item.status, item.answers.measure]), [[2, "submitted", revised.measure], [1, "draft", answers.measure]]);
    assert.equal((await getContractRevision(db, org.id, "owner", 2))?.answers.measure, revised.measure);
    assert.equal(await getContractRevision(db, org.id, "owner", 3), null);
    const audit = await embedded.query<{ action: string; revision: number | null }>("SELECT action, revision FROM audit_events WHERE org_id = $1 ORDER BY occurred_at, id", [org.id]);
    assert.equal(audit.rows.length, 3);
    assert.deepEqual(new Set(audit.rows.filter((item) => item.revision).map((item) => `${item.action}:${item.revision}`)), new Set(["contract.drafted:1", "contract.submitted:2"]));
    await assert.rejects(embedded.query("UPDATE contract_revisions SET status = 'draft' WHERE org_id = $1 AND revision = 2", [org.id]));
  } finally {
    await embedded.close();
  }
});

test("validation, stale saves, role checks, and tenant checks leave no partial history", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const first = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "First mission");
    const second = await createOrganization(db, { uid: "other", email: "other@example.test" }, "Second mission");
    await embedded.query("INSERT INTO workspace_users(id, email) VALUES ('editor', 'editor@example.test')");
    await embedded.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'editor', 'editor', 'active')", [first.id]);
    await assert.rejects(saveContractRevision(db, first.id, "owner", 0, "submitted", { ...answers, measure: " " }), { status: 400 });
    await assert.rejects(saveContractRevision(db, first.id, "editor", 0, "draft", answers), { status: 403 });
    await assert.rejects(saveContractRevision(db, first.id, "other", 0, "draft", answers), { status: 404 });
    await assert.rejects(getContractRevisions(db, second.id, "owner"), { status: 404 });
    await assert.rejects(getContractRevision(db, second.id, "owner", 1), { status: 404 });
    await saveContractRevision(db, first.id, "owner", 0, "draft", { ...answers, measure: " " });
    assert.equal((await getContractRevisions(db, first.id, "owner"))[0]?.answers.measure, "");
    await assert.rejects(saveContractRevision(db, first.id, "owner", 0, "submitted", answers), { status: 409 });
    const counts = await embedded.query<{ revisions: number; audit: number }>("SELECT (SELECT count(*)::int FROM contract_revisions WHERE org_id = $1) AS revisions, (SELECT count(*)::int FROM audit_events WHERE org_id = $1) AS audit", [first.id]);
    assert.deepEqual(counts.rows[0], { revisions: 1, audit: 2 });
  } finally {
    await embedded.close();
  }
});
