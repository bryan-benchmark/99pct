import { configuredEconomicDb } from "../src/economic/db/client";
import { migrateEconomic } from "../src/economic/db/migrate";

function assertDisposable(connection: string) {
  let database = "";
  try {
    database = new URL(connection).pathname.replace(/^\//, "");
  } catch {
    throw new Error("Economic migration URL is invalid.");
  }
  if (database === "missions" || connection.includes("pct99-missions-prod")) {
    throw new Error("Refusing to apply the economic kernel to the production Mission database.");
  }
}

async function main() {
  const connection = process.env.ECONOMIC_MIGRATION_DATABASE_URL;
  if (!connection) throw new Error("ECONOMIC_MIGRATION_DATABASE_URL is required.");
  assertDisposable(connection);
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
