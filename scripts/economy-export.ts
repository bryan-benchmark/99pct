import { configuredEconomicDb } from "../src/economic/db/client";
import { exportMission } from "../src/economic/export/export";

async function main() {
  const connection = process.env.ECONOMIC_VERIFIER_DATABASE_URL;
  const missionId = process.argv[2];
  if (!connection) throw new Error("ECONOMIC_VERIFIER_DATABASE_URL is required.");
  if (!missionId) throw new Error("A Mission id is required.");
  const db = configuredEconomicDb(connection);
  try {
    process.stdout.write(await exportMission(db, missionId));
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic export failed."}\n`);
  process.exitCode = 1;
});
