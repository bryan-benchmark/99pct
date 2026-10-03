import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization } from "./organizations";
import { contractQuestions, getContractRevision, saveContractRevision } from "./contracts";
import { createDecision, decisionQuestions, getDecisionRecord, listDecisions, reviewDecision, saveDecisionRevision } from "./decisions";
import { reviewGateQuestions } from "./review-gates";

const contractAnswers = Object.fromEntries(Object.keys(contractQuestions).map((key) => [key, `Answer ${key}`]));
const lenses = Object.fromEntries(Object.keys(decisionQuestions).map((key) => [key, `Consideration for ${key}`]));
const content = { title: "Change the supplier", action: "Run a 90-day supplier trial with exit criteria.", lenses, evidenceReferences: ["https://example.test/supplier-evidence"] };
const clearGates = Object.fromEntries(Object.keys(reviewGateQuestions).map((key) => [key, { status: "clear", note: "" }]));

test("submitted operating decision gets an independent fixed-revision review and audit events", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Example org");
    await saveContractRevision(db, org.id, "owner", 0, "submitted", contractAnswers);
    await db.query("INSERT INTO workspace_users(id, email) VALUES ('reviewer', 'reviewer@example.test')");
    await db.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'reviewer', 'reviewer', 'active')", [org.id]);
    const created = await createDecision(db, org.id, "owner", 1, "draft", { title: content.title, action: "", lenses: {}, evidenceReferences: [] });
    assert.equal(created.revision, 1);
    await assert.rejects(reviewDecision(db, org.id, created.id, "reviewer", 1, "approved", "Ready", clearGates), { status: 409 });
    const submitted = await saveDecisionRevision(db, org.id, created.id, "owner", 1, "submitted", content);
    assert.equal(submitted.revision, 2);
    await assert.rejects(reviewDecision(db, org.id, created.id, "owner", 2, "approved", "Ready", clearGates), { status: 403 });
    await reviewDecision(db, org.id, created.id, "reviewer", 2, "approved", "Evidence and reversal path are sufficient for a trial.", clearGates);
    await assert.rejects(reviewDecision(db, org.id, created.id, "reviewer", 2, "rejected", "Change mind", clearGates), { status: 409 });
    await saveContractRevision(db, org.id, "owner", 1, "submitted", { ...contractAnswers, worldState: "A newer mission statement" });
    const record = await getDecisionRecord(db, org.id, created.id, "reviewer");
    assert.equal(record.contract_revision, 1);
    assert.equal((await getContractRevision(db, org.id, "reviewer", record.contract_revision))?.answers.worldState, contractAnswers.worldState);
    assert.equal((await getContractRevision(db, org.id, "reviewer", 2))?.answers.worldState, "A newer mission statement");
    assert.deepEqual(record.revisions.map((r) => [r.revision, r.status]), [[2, "submitted"], [1, "draft"]]);
    assert.equal(record.revisions[0]?.content.lenses.opportunityCost, lenses.opportunityCost);
    assert.deepEqual(record.reviews.map((r) => [r.revision, r.disposition]), [[2, "approved"]]);
    assert.equal(record.reviews[0]?.gates?.humanSafety.status, "clear");
    assert.deepEqual((await listDecisions(db, org.id, "owner")).map((d) => [d.id, d.disposition]), [[created.id, "approved"]]);
    const events = await embedded.query<{ action: string }>("SELECT action FROM audit_events WHERE org_id = $1", [org.id]);
    assert.deepEqual(new Set(events.rows.map((e) => e.action)), new Set(["organization.created", "contract.submitted", "decision.drafted", "decision.submitted", "decision.approved"]));
    await assert.rejects(embedded.query("DELETE FROM decision_reviews WHERE org_id = $1", [org.id]));
  } finally { await embedded.close(); }
});

test("approval requires explicit clear hard gates and rejected review preserves unresolved evidence", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Gate org");
    await saveContractRevision(db, org.id, "owner", 0, "submitted", contractAnswers);
    await db.query("INSERT INTO workspace_users(id, email) VALUES ('reviewer', 'reviewer@example.test')");
    await db.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'reviewer', 'reviewer', 'active')", [org.id]);
    const decision = await createDecision(db, org.id, "owner", 1, "submitted", content);
    await assert.rejects(reviewDecision(db, org.id, decision.id, "reviewer", 1, "approved", "Ready", undefined), { status: 400 });
    const unresolved = { ...clearGates, humanSafety: { status: "unresolved", note: "Need a hazard assessment." } };
    await assert.rejects(reviewDecision(db, org.id, decision.id, "reviewer", 1, "approved", "Ready", unresolved), { status: 400 });
    await assert.rejects(reviewDecision(db, org.id, decision.id, "reviewer", 1, "rejected", "Hazard unknown", { ...clearGates, humanSafety: { status: "unresolved", note: "" } }), { status: 400 });
    const before = await db.query<{ reviews: number; events: number }>("SELECT (SELECT count(*)::int FROM decision_reviews WHERE org_id = $1) AS reviews, (SELECT count(*)::int FROM audit_events WHERE org_id = $1 AND action LIKE 'decision.%') AS events", [org.id]);
    assert.deepEqual(before.rows[0], { reviews: 0, events: 1 });
    await reviewDecision(db, org.id, decision.id, "reviewer", 1, "rejected", "Hazard assessment required before approval.", unresolved);
    const record = await getDecisionRecord(db, org.id, decision.id, "owner");
    assert.equal(record.reviews[0]?.gates?.humanSafety.status, "unresolved");
    assert.equal(record.reviews[0]?.gates?.humanSafety.note, "Need a hazard assessment.");
  } finally { await embedded.close(); }
});

test("decision contract, lens, tenant, stale revision, and reviewer permissions fail without partial records", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const first = await createOrganization(db, { uid: "owner1", email: "one@example.test" }, "First org");
    const second = await createOrganization(db, { uid: "owner2", email: "two@example.test" }, "Second org");
    await saveContractRevision(db, first.id, "owner1", 0, "draft", contractAnswers);
    await assert.rejects(createDecision(db, first.id, "owner1", 1, "submitted", content), { status: 409 });
    await saveContractRevision(db, first.id, "owner1", 1, "submitted", contractAnswers);
    await assert.rejects(createDecision(db, first.id, "owner2", 2, "submitted", content), { status: 404 });
    await assert.rejects(createDecision(db, first.id, "owner1", 2, "submitted", { ...content, lenses: { ...lenses, mission: "" } }), { status: 400 });
    const created = await createDecision(db, first.id, "owner1", 2, "submitted", content);
    await assert.rejects(saveDecisionRevision(db, first.id, created.id, "owner1", 2, "submitted", content), { status: 409 });
    await assert.rejects(getDecisionRecord(db, second.id, created.id, "owner2"), { status: 404 });
    await assert.rejects(listDecisions(db, first.id, "owner2"), { status: 404 });
    const counts = await embedded.query<{ decisions: number; revisions: number; reviews: number }>("SELECT (SELECT count(*)::int FROM decisions WHERE org_id = $1) AS decisions, (SELECT count(*)::int FROM decision_revisions WHERE org_id = $1) AS revisions, (SELECT count(*)::int FROM decision_reviews WHERE org_id = $1) AS reviews", [first.id]);
    assert.deepEqual(counts.rows[0], { decisions: 1, revisions: 1, reviews: 0 });
  } finally { await embedded.close(); }
});
