import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { bindMissionEnvironment, missionReleaseTarget } from "../src/missions/environment";

async function main() {
  const connection = process.env.MISSION_MIGRATION_DATABASE_URL;
  const databaseName = process.env.MISSION_EXPECTED_DATABASE_NAME?.trim();
  const projectId = process.env.MISSION_EXPECTED_FIREBASE_PROJECT_ID?.trim();
  const instanceConnectionName = process.env.MISSION_EXPECTED_INSTANCE?.trim();
  if (!connection || !databaseName || !projectId || !instanceConnectionName) throw new Error(missionDatabaseUnavailable);
  const db = configuredMissionDb(connection);
  try {
    const result = await bindMissionEnvironment(db, {
      target: missionReleaseTarget(process.env.MISSION_RELEASE_TARGET),
      projectId,
      databaseName,
      instanceConnectionName,
    });
    process.stdout.write(`Mission database is bound${result.alreadyBound ? " (already bound)" : ""}.\n`);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission environment binding failed."}\n`);
  process.exitCode = 1;
});
