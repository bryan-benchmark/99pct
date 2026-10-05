import { configuredEconomicDb } from "../src/economic/db/client";
import { processPendingIntents } from "../src/economic/worker/process";

async function main() {
  const connection = process.env.ECONOMIC_KERNEL_DATABASE_URL;
  if (!connection) throw new Error("ECONOMIC_KERNEL_DATABASE_URL is required.");
  const workerRef = process.env.ECONOMIC_WORKER_REF ?? "economy-worker";
  const db = configuredEconomicDb(connection);
  try {
    const processed = await processPendingIntents(db, workerRef);
    process.stdout.write(`processed ${processed}\n`);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic worker failed."}\n`);
  process.exitCode = 1;
});
