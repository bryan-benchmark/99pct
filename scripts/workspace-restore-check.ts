import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { productionWorkspaceDb } from "../src/workspace/db/client";
import { workspaceMigrationsCurrent } from "../src/workspace/db/migrate";

const tables = [
  "workspace_schema_migrations", "workspace_users", "organizations", "memberships",
  "invitations", "contract_revisions", "decisions", "decision_revisions", "decision_reviews", "audit_events", "workspace_rate_limits", "workspace_environment",
] as const;

function dedicatedCheckUrl(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required.`);
  if (!new URL(value).pathname.slice(1).endsWith("_check")) throw new Error(`${name} must name a dedicated database ending in _check.`);
  return value;
}

async function main() {
  const sourceUrl = dedicatedCheckUrl(process.env.WORKSPACE_TEST_DATABASE_URL, "WORKSPACE_TEST_DATABASE_URL");
  const restoreUrl = dedicatedCheckUrl(process.env.WORKSPACE_RESTORE_DATABASE_URL, "WORKSPACE_RESTORE_DATABASE_URL");
  if (sourceUrl === restoreUrl) throw new Error("Source and restore databases must differ.");
  const checkOptions = { statementTimeoutMs: 300_000, idleTransactionTimeoutMs: 360_000 };
  const source = productionWorkspaceDb(sourceUrl, checkOptions);
  const restored = productionWorkspaceDb(restoreUrl, checkOptions);
  try {
    const sourceDatabase = (await source.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    const restoredDatabase = (await restored.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    assert.ok(sourceDatabase && restoredDatabase, "Both database identities must be readable");
    assert.notEqual(restoredDatabase, sourceDatabase, "Restore must use a distinct database, even when connection URLs differ");
    assert.equal(await workspaceMigrationsCurrent(source), true, "Source migration history must be current");
    assert.equal(await workspaceMigrationsCurrent(restored), true, "Restored migration history must be current");
    for (const table of tables) {
      const before = await source.query(`SELECT * FROM ${table}`);
      const after = await restored.query(`SELECT * FROM ${table}`);
      const normalized = (rows: Record<string, unknown>[]) => rows.map((row) => JSON.stringify(row)).sort();
      assert.deepEqual(normalized(after.rows), normalized(before.rows), `${table} differs after restore`);
    }
    const event = (await restored.query<{ id: string; org_id: string; actor_id: string; org_seq: string }>("SELECT id, org_id, actor_id, org_seq FROM audit_events ORDER BY org_seq DESC LIMIT 1")).rows[0];
    const contract = (await restored.query<{ org_id: string; revision: number }>("SELECT org_id, revision FROM contract_revisions LIMIT 1")).rows[0];
    const decision = (await restored.query<{ org_id: string; decision_id: string; revision: number }>("SELECT org_id, decision_id, revision FROM decision_revisions LIMIT 1")).rows[0];
    const review = (await restored.query<{ org_id: string; decision_id: string; revision: number }>("SELECT org_id, decision_id, revision FROM decision_reviews LIMIT 1")).rows[0];
    assert.ok(event && contract && decision && review, "Restore drill needs a full synthetic workflow before backup");
    await assert.rejects(restored.query("UPDATE audit_events SET action = action WHERE id = $1", [event.id]), /Workspace history is append only/);
    await assert.rejects(restored.query("UPDATE contract_revisions SET status = status WHERE org_id = $1 AND revision = $2", [contract.org_id, contract.revision]), /Workspace history is append only/);
    await assert.rejects(restored.query("UPDATE decision_revisions SET status = status WHERE org_id = $1 AND decision_id = $2 AND revision = $3", [decision.org_id, decision.decision_id, decision.revision]), /Workspace history is append only/);
    await assert.rejects(restored.query("UPDATE decision_reviews SET disposition = disposition WHERE org_id = $1 AND decision_id = $2 AND revision = $3", [review.org_id, review.decision_id, review.revision]), /Workspace history is append only/);
    const probeId = randomUUID();
    const rollbackProbe = new Error("Restore probe rollback");
    try {
      await restored.transaction(async (tx) => {
        const current = await tx.query<{ org_seq: string }>("SELECT org_seq FROM audit_events WHERE org_id = $1 ORDER BY org_seq DESC LIMIT 1", [event.org_id]);
        const inserted = await tx.query<{ org_seq: string; sequence_backfilled: boolean }>(
          "INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, org_seq, sequence_backfilled) VALUES ($1, $2, $3, 'organization', $2::uuid::text, 'restore.probe', 999999, true) RETURNING org_seq, sequence_backfilled",
          [probeId, event.org_id, event.actor_id],
        );
        assert.ok(inserted.rows[0] && current.rows[0], "Restore probe did not produce an event");
        assert.equal(BigInt(inserted.rows[0].org_seq), BigInt(current.rows[0].org_seq) + BigInt(1), "Restored audit sequence trigger did not assign the next event number");
        assert.equal(inserted.rows[0].sequence_backfilled, false, "Restored audit sequence trigger marked a new event as historical");
        throw rollbackProbe;
      });
    } catch (error) {
      if (error !== rollbackProbe) throw error;
    }
    assert.equal((await restored.query("SELECT id FROM audit_events WHERE id = $1", [probeId])).rows.length, 0, "Restore probe must leave no event behind");
  } finally {
    await Promise.all([source.close(), restored.close()]);
  }
  process.stdout.write("Workspace backup restore check passed: migration history, customer tables, immutable triggers, and audit sequencing match.\n");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Restore check failed."}\n`);
  process.exitCode = 1;
});
