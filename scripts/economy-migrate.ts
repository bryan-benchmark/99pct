import { configuredEconomicDb } from "../src/economic/db/client";
import { assertEconomicMigrationTarget, migrateEconomic } from "../src/economic/db/migrate";

async function main() {
  const connection = process.env.ECONOMIC_MIGRATION_DATABASE_URL;
  if (!connection) throw new Error("ECONOMIC_MIGRATION_DATABASE_URL is required.");
  assertEconomicMigrationTarget(connection, process.env.ECONOMIC_PRODUCTION_SHADOW === "1");
  const db = configuredEconomicDb(connection);
  try {
    await migrateEconomic(db);
    process.stdout.write("Economic migrations applied.\n");
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic migration failed."}\n`);
  process.exitCode = 1;
});
