import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { migrateMissions } from "../src/missions/db/migrate";

async function main() {
  const connection = process.env.MISSION_MIGRATION_DATABASE_URL;
  if (!connection) throw new Error(missionDatabaseUnavailable);
  const db = configuredMissionDb(connection);
  try {
    await migrateMissions(db);
    process.stdout.write("Mission migrations applied.\n");
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission migration failed."}\n`);
  process.exitCode = 1;
});
