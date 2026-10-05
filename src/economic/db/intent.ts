import type { EconomicDb } from "./client";

type IntentId = { id: string };

export async function submitHumanIntent(
  db: Pick<EconomicDb, "query">,
  input: { missionId: string; idempotencyKey: string; actorRef: string; payload: unknown },
) {
  const result = await db.query<IntentId>(
    "SELECT economic.submit_human_intent($1, $2, $3, $4::jsonb) AS id",
    [input.missionId, input.idempotencyKey, input.actorRef, JSON.stringify(input.payload)],
  );
  return { id: result.rows[0].id };
}

export async function submitRecognitionIntent(
  db: Pick<EconomicDb, "query">,
  input: { missionId: string; commandType: "recognize_contribution" | "adjust_mcu"; idempotencyKey: string; payload: unknown },
) {
  const result = await db.query<IntentId>(
    "SELECT economic.submit_recognition_intent($1, $2, $3, $4::jsonb) AS id",
    [input.missionId, input.commandType, input.idempotencyKey, JSON.stringify(input.payload)],
  );
  return { id: result.rows[0].id };
}

export async function submitGovernanceIntent(
  db: Pick<EconomicDb, "query">,
  input: { missionId: string; commandType: "publish_rule" | "activate_rule"; idempotencyKey: string; payload: unknown },
) {
  const result = await db.query<IntentId>(
    "SELECT economic.submit_governance_intent($1, $2, $3, $4::jsonb) AS id",
    [input.missionId, input.commandType, input.idempotencyKey, JSON.stringify(input.payload)],
  );
  return { id: result.rows[0].id };
}

export async function submitBountyRecognitionIntent(
  db: Pick<EconomicDb, "query">,
  input: { missionId: string; idempotencyKey: string; payload: unknown },
) {
  const result = await db.query<IntentId>(
    "SELECT economic.submit_bounty_recognition_intent($1, $2, $3::jsonb) AS id",
    [input.missionId, input.idempotencyKey, JSON.stringify(input.payload)],
  );
  return { id: result.rows[0].id };
}
