import { configuredEconomicDb } from "../src/economic/db/client";
import { cloudKmsSigner } from "../src/economic/checkpoint/kms";
import { processPendingIntents } from "../src/economic/worker/process";

async function main() {
  const connection = process.env.ECONOMIC_KERNEL_DATABASE_URL;
  if (!connection) throw new Error("ECONOMIC_KERNEL_DATABASE_URL is required.");
  const production = connection.includes("pct99-missions-prod");
  if (production && process.env.ECONOMIC_CHECKPOINT_SIGNER !== "kms") {
    throw new Error("Production economic worker requires the Cloud KMS checkpoint signer.");
  }
  const workerRef = process.env.ECONOMIC_WORKER_REF ?? "economy-worker";
  const signer = process.env.ECONOMIC_CHECKPOINT_SIGNER === "kms" ? await cloudKmsSigner() : null;
  const db = configuredEconomicDb(connection);
  try {
    const processed = await processPendingIntents(db, workerRef, 32, signer);
    process.stdout.write(`processed ${processed}\n`);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic worker failed."}\n`);
  process.exitCode = 1;
});
