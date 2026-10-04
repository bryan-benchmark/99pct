import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { missionMigrationsCurrent } from "../src/missions/db/migrate";
import { createFormingMission, getPublicMission, listPublicMissions } from "../src/missions/store";

async function main() {
  const connection = process.env.MISSION_RUNTIME_DATABASE_URL;
  if (!connection) throw new Error(missionDatabaseUnavailable);
  const databaseName = new URL(connection).pathname.slice(1);
  if (!databaseName.endsWith("mission_check")) throw new Error("The smoke test only runs against a database whose name ends with mission_check.");
  const db = configuredMissionDb(connection);
  try {
    if (!await missionMigrationsCurrent(db)) throw new Error("Mission migrations are not current.");
    const suffix = randomUUID().slice(0, 8);
    const creator = { uid: `smoke-${suffix}`, email: `smoke-${suffix}@example.test` };
    const created = await createFormingMission(db, creator, {
      name: `Smoke ${suffix}`,
      purpose: "Prove the restricted Mission role can write.",
      beneficiaries: "The readiness check",
      startingPlace: "Global",
    });
    const refreshed = await createFormingMission(db, { ...creator, email: `refreshed-${suffix}@example.test` }, {
      name: `Smoke ${suffix}`,
      purpose: "Prove the restricted Mission role can write.",
      beneficiaries: "The readiness check",
      startingPlace: "Global",
    });
    assert.notEqual(refreshed.slug, created.slug);
    const listed = await listPublicMissions(db);
    const loaded = await getPublicMission(db, created.slug);
    assert.equal(JSON.stringify({ listed, loaded }).includes(creator.email), false);
    assert.equal(loaded?.status, "forming");
    await assert.rejects(db.query("UPDATE mission_revisions SET name = name"));
    await assert.rejects(db.query("DELETE FROM mission_revisions"));
    await assert.rejects(db.query("UPDATE missions SET status = status"));
    await assert.rejects(db.query("DELETE FROM missions"));
    await assert.rejects(db.query("INSERT INTO mission_schema_migrations (name, sha256) VALUES ('blocked', 'blocked')"));
    await assert.rejects(db.query("DROP TABLE missions"));
    process.stdout.write("Mission PostgreSQL smoke passed.\n");
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission smoke check failed."}\n`);
  process.exitCode = 1;
});
