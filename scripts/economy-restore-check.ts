import assert from "node:assert/strict";
import { configuredEconomicDb } from "../src/economic/db/client";
import { economicMigrationsCurrent } from "../src/economic/db/migrate";
import { exportMission } from "../src/economic/export/export";
import { verifyExport } from "../src/economic/verify/verify";

const tables = ["schema_migrations", "command_intents", "intent_outcomes", "commands", "events", "rule_versions", "reward_keys"] as const;

function checkUrl(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required.`);
  const database = new URL(value).pathname.slice(1);
  if (database === "missions" || database === "economy" || value.includes("pct99-missions-prod")) {
    throw new Error(`${name} must be a disposable economic database.`);
  }
  return value;
}

async function main() {
  const sourceUrl = checkUrl(process.env.ECONOMIC_MIGRATION_DATABASE_URL, "ECONOMIC_MIGRATION_DATABASE_URL");
  const restoreUrl = checkUrl(process.env.ECONOMIC_RESTORE_DATABASE_URL, "ECONOMIC_RESTORE_DATABASE_URL");
  if (sourceUrl === restoreUrl) throw new Error("Source and restore databases must differ.");
  const source = configuredEconomicDb(sourceUrl);
  const restored = configuredEconomicDb(restoreUrl);
  try {
    const sourceDatabase = (await source.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    const restoredDatabase = (await restored.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    assert.notEqual(restoredDatabase, sourceDatabase);
    assert.equal(await economicMigrationsCurrent(source), true);
    assert.equal(await economicMigrationsCurrent(restored), true);
    for (const table of tables) {
      const before = await source.query(`SELECT * FROM economic.${table}`);
      const after = await restored.query(`SELECT * FROM economic.${table}`);
      const normalized = (rows: Record<string, unknown>[]) => rows.map((row) => JSON.stringify(row)).sort();
      assert.deepEqual(normalized(after.rows), normalized(before.rows), `${table} differs after restore`);
    }
    const missions = await restored.query<{ mission_id: string }>("SELECT DISTINCT mission_id FROM economic.events");
    assert.ok(missions.rows.length > 0, "Restore drill needs representative economic history.");
    for (const mission of missions.rows) {
      const exported = await exportMission(restored, mission.mission_id);
      const verification = verifyExport(exported);
      assert.equal(verification.ok, true, verification.ok ? "" : verification.errors.join("\n"));
    }
    await assert.rejects(restored.query("UPDATE economic.events SET subject_ref = subject_ref"), /append-only/);
    await assert.rejects(restored.query("DELETE FROM economic.intent_outcomes"), /append-only/);
    process.stdout.write("Economic backup restore check passed.\n");
  } finally {
    await Promise.all([source.close(), restored.close()]);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic restore check failed."}\n`);
  process.exitCode = 1;
});
