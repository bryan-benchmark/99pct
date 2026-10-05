import { randomUUID } from "node:crypto";
import type { CheckpointSigner } from "./checkpoint";
import { checkpointFromEvents, checkpointMessage, verifyCheckpointSignature } from "./checkpoint";
import type { EconomicDb } from "../db/client";
import { listEconomicEvents } from "../db/commit";

function pgCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String(error.code);
}

export async function anchorUncheckpointed(db: EconomicDb, signer: CheckpointSigner) {
  const pending = await db.query<{ mission_id: string }>(
    `SELECT mission_id FROM economic.events
      GROUP BY mission_id
     HAVING max(sequence) > COALESCE((SELECT max(last_sequence) FROM economic.checkpoints WHERE mission_id = economic.events.mission_id), 0)`,
  );
  let anchored = 0;
  for (const row of pending.rows) {
    const events = await listEconomicEvents(db, row.mission_id);
    const checkpoint = checkpointFromEvents(events, new Date().toISOString(), signer.signerRef);
    const signature = await signer.sign(checkpointMessage(checkpoint));
    const signed = { checkpoint, signature };
    if (!verifyCheckpointSignature(signed, signer.publicKeyPem)) throw new Error("Checkpoint signature did not verify.");
    try {
      await db.query(
        `INSERT INTO economic.checkpoints
           (id, mission_id, last_sequence, last_event_hash, event_count, checkpoint_at, signer_ref, public_key_pem, signature)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          randomUUID(),
          checkpoint.missionId,
          checkpoint.lastSequence,
          checkpoint.lastEventHash,
          checkpoint.eventCount,
          checkpoint.checkpointAt,
          checkpoint.signerRef,
          signer.publicKeyPem,
          signature,
        ],
      );
      anchored += 1;
    } catch (error) {
      if (pgCode(error) !== "23505") throw error;
    }
  }
  return anchored;
}
