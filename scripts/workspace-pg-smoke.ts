import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { productionWorkspaceDb, workspaceIdleTransactionTimeoutMs, workspaceStatementTimeoutMs } from "../src/workspace/db/client";
import { migrateWorkspace, workspaceMigrationsCurrent } from "../src/workspace/db/migrate";
import { createOrganization, getOrganizationForMember } from "../src/workspace/organizations";
import { saveContractRevision, contractQuestions } from "../src/workspace/contracts";
import { createInvitation, acceptInvitation, revokeMember } from "../src/workspace/invitations";
import { createDecision, decisionQuestions, reviewDecision } from "../src/workspace/decisions";
import { exportOrganizationRecord, listAuditEvents } from "../src/workspace/audit";
import { readWorkspaceSnapshot } from "../src/workspace/access";
import { WorkspaceError } from "../src/workspace/organizations";
import { consumeWorkspaceRateLimit } from "../src/workspace/rate-limit";
import { reviewGateQuestions } from "../src/workspace/review-gates";

async function main() {
  const connectionString = process.env.WORKSPACE_TEST_DATABASE_URL;
  if (!connectionString) throw new Error("WORKSPACE_TEST_DATABASE_URL is required; use a dedicated disposable check database.");
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!databaseName.endsWith("workspace_check")) throw new Error("The smoke test only runs against a database whose name ends with workspace_check.");
  const db = productionWorkspaceDb(connectionString);
  let orgId = "";
  try {
    const timeouts = await db.query<{ statement_timeout: string; idle_in_transaction_session_timeout: string }>("SELECT current_setting('statement_timeout') AS statement_timeout, current_setting('idle_in_transaction_session_timeout') AS idle_in_transaction_session_timeout");
    if (timeouts.rows[0]?.statement_timeout !== `${workspaceStatementTimeoutMs / 1000}s` || timeouts.rows[0]?.idle_in_transaction_session_timeout !== `${workspaceIdleTransactionTimeoutMs / 1000}s`) throw new Error("PostgreSQL did not apply workspace query timeouts.");
    if (process.env.WORKSPACE_TEST_MIGRATION_DATABASE_URL) {
      const migrationDb = productionWorkspaceDb(process.env.WORKSPACE_TEST_MIGRATION_DATABASE_URL, { statementTimeoutMs: 300_000, idleTransactionTimeoutMs: 360_000 });
      try { await migrateWorkspace(migrationDb); }
      finally { await migrationDb.close(); }
    } else await migrateWorkspace(db);
    if (!await workspaceMigrationsCurrent(db)) throw new Error("Migrations are not current.");
    const suffix = randomUUID();
    const owner = { uid: `smoke-owner-${suffix}`, email: `owner-${suffix}@example.test` };
    const reviewer = { uid: `smoke-reviewer-${suffix}`, email: `reviewer-${suffix}@example.test` };
    const org = await createOrganization(db, owner, `Smoke check ${suffix}`);
    orgId = org.id;
    const answers = Object.fromEntries(Object.keys(contractQuestions).map((key) => [key, `Smoke answer for ${key}`]));
    await saveContractRevision(db, org.id, owner.uid, 0, "submitted", answers);
    const invite = await createInvitation(db, org.id, owner.uid, reviewer.email, "reviewer");
    await acceptInvitation(db, invite.token, reviewer);
    const lenses = Object.fromEntries(Object.keys(decisionQuestions).map((key) => [key, `Smoke consideration for ${key}`]));
    const decision = await createDecision(db, org.id, owner.uid, 1, "submitted", { title: "Smoke operating decision", action: "Run a reversible check.", lenses, evidenceReferences: [] });
    const gates = Object.fromEntries(Object.keys(reviewGateQuestions).map((key) => [key, { status: "clear", note: "" }]));
    await reviewDecision(db, org.id, decision.id, reviewer.uid, 1, "approved", "Independent smoke review.", gates);
    const exportRecord = await exportOrganizationRecord(db, org.id, owner.uid);
    if (exportRecord.auditEvents.length !== 6 || exportRecord.decisionReviews.length !== 1) throw new Error("Committed workflow did not export all expected history.");
    if (await getOrganizationForMember(db, org.id, "unrelated-user")) throw new Error("Tenant isolation failed.");
    const quotaResults = await Promise.allSettled(Array.from({ length: 35 }, () => consumeWorkspaceRateLimit(db, "session_hour", `smoke-session-${suffix}`)));
    if (quotaResults.filter((result) => result.status === "fulfilled").length !== 30 || quotaResults.filter((result) => result.status === "rejected" && (result.reason as { status?: number })?.status === 429).length !== 5) {
      throw new Error("Concurrent PostgreSQL rate limit did not enforce exactly 30 accepted requests.");
    }
    await Promise.all(Array.from({ length: 10 }, (_, index) => createInvitation(db, org.id, owner.uid, `parallel-${index}-${suffix}@example.test`, "reviewer")));
    const sequence = await db.query<{ org_seq: string }>("SELECT org_seq FROM audit_events WHERE org_id = $1 ORDER BY org_seq", [org.id]);
    if (sequence.rows.length !== 16 || sequence.rows.some((row, index) => Number(row.org_seq) !== index + 1)) throw new Error("Concurrent workspace events did not receive a contiguous organization sequence.");
    const secondConnection = productionWorkspaceDb(connectionString);
    try {
      await readWorkspaceSnapshot(db, org.id, reviewer.uid, "read", async (tx) => {
        const before = await tx.query<{ total: number }>("SELECT count(*)::int AS total FROM audit_events WHERE org_id = $1", [org.id]);
        await revokeMember(secondConnection, org.id, owner.uid, reviewer.uid);
        const after = await tx.query<{ total: number }>("SELECT count(*)::int AS total FROM audit_events WHERE org_id = $1", [org.id]);
        assert.equal(after.rows[0]?.total, before.rows[0]?.total, "An authorized read must keep one snapshot if membership changes mid-read.");
      });
      await assert.rejects(listAuditEvents(db, org.id, reviewer.uid), (error) => error instanceof WorkspaceError && error.status === 404);
    } finally { await secondConnection.close(); }
  } finally {
    await db.close();
  }
  const reopened = productionWorkspaceDb(connectionString);
  try {
    if (!await getOrganizationForMember(reopened, orgId, (await reopened.query<{ user_id: string }>("SELECT user_id FROM memberships WHERE org_id = $1 AND role = 'owner'", [orgId])).rows[0]?.user_id || "")) throw new Error("Organization was not durable across a connection restart.");
  } finally { await reopened.close(); }
  process.stdout.write(`PostgreSQL workspace smoke test passed for organization ${orgId}.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "PostgreSQL smoke test failed."}\n`);
  process.exitCode = 1;
});
