import assert from "node:assert/strict";
import { Client } from "pg";
import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { missionMigrationsCurrent } from "../src/missions/db/migrate";
import { assertMissionEnvironment } from "../src/missions/environment";

async function main() {
  const connection = process.env.MISSION_RUNTIME_DATABASE_URL;
  const target = process.env.MISSION_RELEASE_TARGET?.trim();
  const projectId = process.env.MISSION_EXPECTED_FIREBASE_PROJECT_ID?.trim();
  const instanceConnectionName = process.env.MISSION_EXPECTED_INSTANCE?.trim();
  if (!connection || target !== "production" || !projectId || !instanceConnectionName) throw new Error(missionDatabaseUnavailable);
  const databaseName = new URL(connection).pathname.slice(1);
  if (databaseName !== "missions") throw new Error("The production check only runs against the missions database.");
  const db = configuredMissionDb(connection);
  try {
    if (!await missionMigrationsCurrent(db)) throw new Error("Mission migrations are not current.");
    await assertMissionEnvironment(db, { target: "production", projectId, databaseName, instanceConnectionName });
  } finally {
    await db.close();
  }

  const client = new Client({ connectionString: connection, application_name: "pct99-missions" });
  await client.connect();
  try {
    const before = await client.query<{ missions: number; accounts: number }>(
      "SELECT (SELECT count(*) FROM missions)::int AS missions, (SELECT count(*) FROM human_accounts)::int AS accounts",
    );
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ('prod-check', 'prod-check@example.test')",
    );
    await client.query("ROLLBACK");
    await client.query("BEGIN");
    const forbidden = await client.query("UPDATE mission_revisions SET name = name").then(
      () => "allowed",
      (error: unknown) => (error instanceof Error ? error.message : "rejected"),
    );
    await client.query("ROLLBACK");
    if (!/append-only|permission denied/i.test(forbidden)) throw new Error("Mission runtime role accepted a revision update.");
    const after = await client.query<{ missions: number; accounts: number }>(
      "SELECT (SELECT count(*) FROM missions)::int AS missions, (SELECT count(*) FROM human_accounts)::int AS accounts",
    );
    assert.deepEqual(after.rows[0], before.rows[0]);
    process.stdout.write("Mission production check passed with no persisted rows.\n");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission production check failed."}\n`);
  process.exitCode = 1;
});
