import { randomUUID } from "node:crypto";
import { commandFromIntent, type IntentRow } from "../capability";
import type { EconomicDb } from "../db/client";
import { commitCommand } from "../db/commit";
import { EconomicRefusal } from "../model";

const claimSql = `SELECT id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitter_capability
  FROM economic.command_intents
 WHERE NOT EXISTS (SELECT 1 FROM economic.intent_outcomes WHERE intent_id = economic.command_intents.id)
 ORDER BY submitted_at, id
 LIMIT 16`;

function pgCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String(error.code);
}

async function takePendingIntent(tx: Pick<EconomicDb, "query">) {
  const pending = await tx.query<IntentRow>(claimSql);
  for (const row of pending.rows) {
    const lock = await tx.query<{ locked: boolean }>("SELECT pg_try_advisory_xact_lock(hashtext($1::text)) AS locked", [row.id]);
    if (lock.rows[0]?.locked) return row;
  }
  return null;
}

async function recordOutcome(
  tx: Pick<EconomicDb, "query">,
  intentId: string,
  outcome: "accepted" | "refused",
  commandId: string | null,
  refusalCode: string | null,
  workerRef: string,
) {
  await tx.query(
    `INSERT INTO economic.intent_outcomes (intent_id, outcome, command_id, refusal_code, processed_at, worker_ref)
     VALUES ($1, $2, $3, $4, clock_timestamp(), $5)`,
    [intentId, outcome, commandId, refusalCode, workerRef],
  );
}

async function processOne(db: EconomicDb, workerRef: string) {
  return db.transaction(async (tx) => {
    const row = await takePendingIntent(tx);
    if (!row) return false;
    let accepted: { commandId: string } | null = null;
    let refusal: string | null = null;
    try {
      const command = commandFromIntent(row);
      accepted = await commitCommand(db, command, randomUUID, () => new Date(), tx);
    } catch (error) {
      if (!(error instanceof EconomicRefusal)) throw error;
      refusal = error.code;
    }
    await tx.query("SAVEPOINT intent_outcome");
    try {
      if (accepted) await recordOutcome(tx, row.id, "accepted", accepted.commandId, null, workerRef);
      else await recordOutcome(tx, row.id, "refused", null, refusal, workerRef);
    } catch (error) {
      await tx.query("ROLLBACK TO SAVEPOINT intent_outcome");
      if (pgCode(error) === "23505") return true;
      throw error;
    }
    return true;
  });
}

export async function processPendingIntents(db: EconomicDb, workerRef: string, limit = 32) {
  let processed = 0;
  for (let index = 0; index < limit; index += 1) {
    let done = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        done = await processOne(db, workerRef);
        break;
      } catch (error) {
        const code = pgCode(error);
        if ((code === "40001" || code === "40P01") && attempt < 4) continue;
        throw error;
      }
    }
    if (!done) break;
    processed += 1;
  }
  return processed;
}
