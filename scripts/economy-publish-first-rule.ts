import { configuredEconomicDb } from "../src/economic/db/client";
import { submitGovernanceIntent } from "../src/economic/db/intent";
import { firstRecognitionRule } from "../src/economic/first-rule";
import { cloudKmsSigner, gcloudAccessToken } from "../src/economic/checkpoint/kms";
import { processPendingIntents } from "../src/economic/worker/process";

async function main() {
  const connection = process.env.ECONOMIC_GOVERNANCE_DATABASE_URL;
  const kernel = process.env.ECONOMIC_KERNEL_DATABASE_URL;
  const missionId = process.env.ECONOMIC_CANARY_MISSION_ID;
  if (!connection || !kernel || !missionId) throw new Error("Governance publication requires the governance database, kernel database, and canary Mission.");
  if (!connection.includes("pct99-missions-prod") || !kernel.includes("pct99-missions-prod")) {
    throw new Error("First-rule publication is only for the production economy database.");
  }
  if (process.env.ECONOMIC_PRODUCTION_SHADOW !== "1" || process.env.ECONOMIC_CHECKPOINT_SIGNER !== "kms") {
    throw new Error("First-rule publication requires the production shadow flag and the Cloud KMS signer.");
  }
  const governance = configuredEconomicDb(connection);
  const writer = configuredEconomicDb(kernel);
  try {
    const definition = { amount: firstRecognitionRule.amount, kind: firstRecognitionRule.kind, scale: firstRecognitionRule.scale };
    const published = await submitGovernanceIntent(governance, {
      missionId,
      commandType: "publish_rule",
      idempotencyKey: "fixed-recognition-v1-publish",
      payload: { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version, definition },
    });
    const activated = await submitGovernanceIntent(governance, {
      missionId,
      commandType: "activate_rule",
      idempotencyKey: "fixed-recognition-v1-activate",
      payload: { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version },
    });
    const signer = await cloudKmsSigner({ auth: process.env.ECONOMIC_KMS_AUTH === "gcloud" ? gcloudAccessToken() : undefined });
    const processed = await processPendingIntents(writer, "economy-kernel-worker", 8, signer);
    process.stdout.write(`published ${published.id}\nactivated ${activated.id}\nprocessed ${processed}\n`);
  } finally {
    await governance.close();
    await writer.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "First-rule publication failed."}\n`);
  process.exitCode = 1;
});
