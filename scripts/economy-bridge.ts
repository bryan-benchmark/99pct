import { configuredEconomicDb } from "../src/economic/db/client";
import { submitRecognitionIntent } from "../src/economic/db/intent";
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
  const missions = configuredMissionDb(missionUrl);
  const recognition = configuredEconomicDb(recognitionUrl);
  const verifier = configuredEconomicDb(verifierUrl);
  try {
    const bridged = await bridgePendingRecognitions(missions, (input) => {
      if (input.missionId !== missionId) throw new Error("Recognition bridge refused a Mission outside the canary.");
      return submitRecognitionIntent(recognition, { missionId: input.missionId, commandType: "recognize_contribution", idempotencyKey: input.idempotencyKey, payload: input.payload });
    }, missionId);
    const grants = await verifier.query<{
      contribution_id: string; amount: string; rule_id: string; rule_version: string; event_id: string; last_sequence: string;
    }>(
      `SELECT split_part(recognized.subject_ref, 'contribution:', 2) AS contribution_id,
              granted.payload->>'amount' AS amount,
              granted.payload->>'ruleId' AS rule_id,
              granted.payload->>'ruleVersion' AS rule_version,
              granted.id AS event_id,
              checkpoints.last_sequence::text AS last_sequence
         FROM economic.events recognized
         JOIN economic.events granted
           ON granted.mission_id = recognized.mission_id
          AND granted.event_type = 'mcu_granted'
          AND granted.payload->>'contributionRef' = recognized.subject_ref
         JOIN economic.checkpoints
           ON checkpoints.mission_id = granted.mission_id
          AND checkpoints.last_sequence >= granted.sequence
          AND checkpoints.last_event_hash = (
            SELECT event_hash FROM economic.events
             WHERE mission_id = checkpoints.mission_id
             ORDER BY sequence DESC
             LIMIT 1
          )
        WHERE recognized.mission_id = $1
          AND recognized.event_type = 'contribution_recognized'
          AND granted.payload->>'amount' = $2
          AND granted.payload->>'ruleId' = $3
          AND granted.payload->>'ruleVersion' = $4`,
      [missionId, firstRecognitionRule.amount, firstRecognitionRule.ruleId, firstRecognitionRule.version],
    );
    const recorded = await recordAnchoredGrants(missions, grants.rows.map((row) => ({
      contributionId: row.contribution_id,
      amount: row.amount,
      ruleId: row.rule_id,
      ruleVersion: row.rule_version,
      eventId: row.event_id,
      checkpointSequence: row.last_sequence,
    })));
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
