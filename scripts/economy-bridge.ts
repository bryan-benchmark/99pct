import { economyLedgerPublicKeyPem } from "../src/economic/checkpoint/economy-ledger-public";
import { plannedKmsKeyVersion } from "../src/economic/checkpoint/kms";
import { grantsFromVerifiedCheckpoint } from "../src/economic/checkpoint/trust";
import { configuredEconomicDb } from "../src/economic/db/client";
import { submitRecognitionIntent } from "../src/economic/db/intent";
import { exportMission } from "../src/economic/export/export";
import { configuredMissionDb } from "../src/missions/db/client";
import { bridgePendingRecognitions, recordAnchoredGrants } from "../src/missions/bridge";
import { firstRecognitionRule } from "../src/economic/first-rule";

async function main() {
  const missionUrl = process.env.MISSION_BRIDGE_DATABASE_URL;
  const recognitionUrl = process.env.ECONOMIC_RECOGNITION_DATABASE_URL;
  const verifierUrl = process.env.ECONOMIC_VERIFIER_DATABASE_URL;
  const missionId = process.env.ECONOMIC_CANARY_MISSION_ID;
  if (!missionUrl || !recognitionUrl || !verifierUrl || !missionId) {
    throw new Error("The recognition bridge requires its Mission database, recognition database, verifier database, and canary Mission.");
  }
  const trustedPublicKeyPem = economyLedgerPublicKeyPem;
  const trustedSignerRef = plannedKmsKeyVersion();
  const missions = configuredMissionDb(missionUrl);
  const recognition = configuredEconomicDb(recognitionUrl);
  const verifier = configuredEconomicDb(verifierUrl);
  try {
    const bridged = await bridgePendingRecognitions(missions, (input) => {
      if (input.missionId !== missionId) throw new Error("Recognition bridge refused a Mission outside the canary.");
      return submitRecognitionIntent(recognition, { missionId: input.missionId, commandType: "recognize_contribution", idempotencyKey: input.idempotencyKey, payload: input.payload });
    }, missionId);
    const exported = await exportMission(verifier, missionId);
    const checkpoint = await verifier.query<{
      last_sequence: string; last_event_hash: string; event_count: string; checkpoint_at: Date | string; signer_ref: string; signature: string;
    }>(
      `SELECT last_sequence::text, last_event_hash, event_count::text, checkpoint_at, signer_ref, signature
         FROM economic.checkpoints
        WHERE mission_id = $1
        ORDER BY last_sequence DESC
        LIMIT 1`,
      [missionId],
    );
    const row = checkpoint.rows[0];
    const grants = row ? grantsFromVerifiedCheckpoint(exported, {
      checkpoint: {
        format: "economic-checkpoint-v1",
        missionId,
        lastSequence: row.last_sequence,
        lastEventHash: row.last_event_hash,
        eventCount: row.event_count,
        checkpointAt: new Date(row.checkpoint_at).toISOString(),
        signerRef: row.signer_ref,
      },
      signature: row.signature,
    }, trustedPublicKeyPem, trustedSignerRef) : [];
    const recorded = await recordAnchoredGrants(missions, grants.filter((grant) => (
      grant.amount === firstRecognitionRule.amount
      && grant.ruleId === firstRecognitionRule.ruleId
      && grant.ruleVersion === firstRecognitionRule.version
    )));
    process.stdout.write(`bridged ${bridged}\nanchored ${recorded}\n`);
  } finally {
    await missions.close();
    await recognition.close();
    await verifier.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Recognition bridge failed."}\n`);
  process.exitCode = 1;
});
