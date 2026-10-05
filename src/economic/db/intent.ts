import { randomUUID } from "node:crypto";
import { canonicalize } from "../canonical";
import type { EconomicDb } from "./client";
import { assertCommand } from "../model";

export async function submitCommandIntent(db: Pick<EconomicDb, "query">, input: unknown) {
  const command = assertCommand(input);
  const id = randomUUID();
  await db.query(
    `INSERT INTO economic.command_intents
       (id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
    [id, command.missionId, command.type, command.idempotencyKey, command.actor.kind, command.actor.ref, canonicalize(command.payload)],
  );
  return { id };
}
