import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { createOrganization } from "./organizations";
import { createInvitation, acceptInvitation, revokeMember } from "./invitations";
import { contractQuestions, saveContractRevision } from "./contracts";
import { createDecision, decisionQuestions, reviewDecision } from "./decisions";
import { reviewGateQuestions } from "./review-gates";
import { exportOrganizationRecord, listAuditEvents } from "./audit";
import { checkWorkspaceAuditIntegrity } from "./audit-integrity";
import { verifyOrganizationExport } from "./export-verification";

test("audit view and versioned export contain the exact committed workflow for one tenant", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Export org");
    const other = await createOrganization(db, { uid: "other", email: "other@example.test" }, "Other org");
    const contractAnswers = Object.fromEntries(Object.keys(contractQuestions).map((key) => [key, `Answer ${key}`]));
    await saveContractRevision(db, org.id, "owner", 0, "submitted", contractAnswers);
    const invite = await createInvitation(db, org.id, "owner", "reviewer@example.test", "reviewer");
    await acceptInvitation(db, invite.token, { uid: "reviewer", email: "reviewer@example.test" });
    const lenses = Object.fromEntries(Object.keys(decisionQuestions).map((key) => [key, `Answer ${key}`]));
    const decision = await createDecision(db, org.id, "owner", 1, "submitted", { title: "Trial", action: "Run a trial", lenses, evidenceReferences: [] });
    const gates = Object.fromEntries(Object.keys(reviewGateQuestions).map((key) => [key, { status: "clear", note: "" }]));
    await reviewDecision(db, org.id, decision.id, "reviewer", 1, "rejected", "Need stronger cost evidence.", gates);
    await revokeMember(db, org.id, "owner", "reviewer");
    const events = await listAuditEvents(db, org.id, "owner");
    assert.deepEqual(events.map((e) => e.action), ["organization.created", "contract.submitted", "invitation.created", "membership.joined", "decision.submitted", "decision.rejected", "membership.revoked"]);
    assert.equal(events.every((e) => e.actor_email.includes("@example.test")), true);
    const exported = await exportOrganizationRecord(db, org.id, "owner");
    assert.equal(exported.exportSchemaVersion, 2);
    assert.equal(exported.organization.id, org.id);
    assert.equal(exported.contractRevisions.length, 1);
    assert.equal(exported.decisions.length, 1);
    assert.equal(exported.decisionReviews.length, 1);
    assert.equal((exported.decisionReviews[0] as { gates: { humanSafety: { status: string } } }).gates.humanSafety.status, "clear");
    assert.equal(exported.auditEvents.length, events.length);
    assert.deepEqual(events.map((event) => Number(event.org_seq)), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(events.every((event) => event.sequence_backfilled === false), true);
    assert.equal(JSON.stringify(exported).includes(invite.token), false);
    assert.equal(JSON.stringify(exported).includes(other.id), false);
    const { checksum, ...data } = exported;
    assert.equal(checksum.value, createHash("sha256").update(JSON.stringify(data)).digest("hex"));
    const downloaded = JSON.parse(JSON.stringify(exported)) as Awaited<ReturnType<typeof exportOrganizationRecord>>;
    assert.deepEqual(verifyOrganizationExport(downloaded), { organizationId: org.id, members: 2, decisions: 1, events: 7 });
    downloaded.contractRevisions[0] = { ...downloaded.contractRevisions[0], status: "draft" };
    assert.throws(() => verifyOrganizationExport(downloaded), /checksum does not match/);
    const modifiedData: Record<string, unknown> = { ...downloaded };
    delete modifiedData.checksum;
    downloaded.checksum.value = createHash("sha256").update(JSON.stringify(modifiedData)).digest("hex");
    assert.throws(() => verifyOrganizationExport(downloaded), /not linked to a submitted contract/);
    downloaded.contractRevisions[0] = { ...downloaded.contractRevisions[0], status: "submitted" };
    downloaded.auditEvents[0] = { ...downloaded.auditEvents[0], action: "untracked.change" };
    const alteredEvents: Record<string, unknown> = { ...downloaded };
    delete alteredEvents.checksum;
    downloaded.checksum.value = createHash("sha256").update(JSON.stringify(alteredEvents)).digest("hex");
    assert.throws(() => verifyOrganizationExport(downloaded), /does not match a source transition/);
    const healthy = await checkWorkspaceAuditIntegrity(db);
    assert.deepEqual(healthy.issues, []);
    assert.equal(healthy.organizationsChecked, 2);
    await assert.rejects(exportOrganizationRecord(db, org.id, "other"), { status: 404 });
    await assert.rejects(listAuditEvents(db, other.id, "owner"), { status: 404 });
    await assert.rejects(exportOrganizationRecord(db, org.id, "reviewer"), { status: 404 });
  } finally { await embedded.close(); }
});

test("audit checker detects missing, duplicate, and extra events without editing history", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Integrity org");
    assert.deepEqual((await checkWorkspaceAuditIntegrity(db)).issues, []);
    await db.query("INSERT INTO contract_revisions(org_id, revision, author_id, status, answers) VALUES ($1, 1, 'owner', 'draft', '{}')", [org.id]);
    await db.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, revision) VALUES ('3a7b4b31-026d-4ee3-9d59-dc4f3434bcdf', $1, 'owner', 'decision', 'extra', 'decision.drafted', 1)", [org.id]);
    await db.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, payload) VALUES ('06f66cc4-3f78-4d2e-b360-7945359c0d23', $1, 'owner', 'organization', $1::uuid::text, 'organization.created', $2)", [org.id, JSON.stringify({ name: "Integrity org" })]);
    const report = await checkWorkspaceAuditIntegrity(db);
    assert.equal(report.issues.some((issue) => issue.includes("source transition has 0 matching events")), true);
    assert.equal(report.issues.some((issue) => issue.includes("source transition has 2 matching events")), true);
    assert.equal(report.issues.some((issue) => issue.includes("extra or mismatched event")), true);
  } finally { await embedded.close(); }
});

test("audit checker replays access changes and detects unaudited status writes", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const org = await createOrganization(db, { uid: "owner", email: "owner@example.test" }, "Access history org");
    const first = await createInvitation(db, org.id, "owner", "reviewer@example.test", "reviewer");
    await acceptInvitation(db, first.token, { uid: "reviewer", email: "reviewer@example.test" });
    await revokeMember(db, org.id, "owner", "reviewer");
    const second = await createInvitation(db, org.id, "owner", "reviewer@example.test", "editor");
    await acceptInvitation(db, second.token, { uid: "reviewer", email: "reviewer@example.test" });
    assert.deepEqual((await checkWorkspaceAuditIntegrity(db)).issues, []);
    await db.query("UPDATE memberships SET status = 'revoked' WHERE org_id = $1 AND user_id = 'reviewer'", [org.id]);
    const pending = await createInvitation(db, org.id, "owner", "third@example.test", "reviewer");
    await db.query("UPDATE invitations SET status = 'revoked', revoked_at = now() WHERE org_id = $1 AND id = $2", [org.id, pending.id]);
    const report = await checkWorkspaceAuditIntegrity(db);
    assert.equal(report.issues.some((issue) => issue.includes("membership state differs from events")), true);
    assert.equal(report.issues.some((issue) => issue.includes("invitation state differs from events")), true);
  } finally { await embedded.close(); }
});
