import { randomUUID } from "node:crypto";
import { CanonicalError, assertCanonical, canonicalize, type CanonicalValue } from "../canonical";
import { sealDrafts, verifyChain } from "../chain";
import type { EconomicDb } from "./client";
import { evaluate } from "../engine/evaluate";
import {
  EconomicRefusal,
  assertCommand,
  commandHash,
  type EconomicCommand,
  type EconomicEvent,
  type EventType,
} from "../model";
import { QuantityError } from "../quantity";

export type CommitResult = {
  status: "accepted" | "replayed";
  commandId: string;
  eventIds: string[];
};

type EventRow = {
  id: string;
  mission_id: string;
  sequence: string | number;
  event_type: EventType;
  command_id: string;
  actor_kind: "human" | "process";
  actor_ref: string;
  subject_kind: string;
  subject_ref: string;
  rule_id: string | null;
  rule_version: string | number | null;
  payload: unknown;
  payload_hash: string;
  previous_event_hash: string | null;
  event_hash: string;
  recorded_at: Date | string;
};

function asSequence(value: string | number) {
  const sequence = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new EconomicRefusal("broken_history", "Economic sequence is invalid.");
  return sequence;
}

function asRecord(value: unknown): { [key: string]: CanonicalValue } {
  assertCanonical(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EconomicRefusal("broken_history", "Economic payload is invalid.");
  return value;
}

function mapEvent(row: EventRow): EconomicEvent {
  const recordedAt = row.recorded_at instanceof Date ? row.recorded_at.toISOString() : new Date(row.recorded_at).toISOString();
  return {
    id: row.id,
    missionId: row.mission_id,
    sequence: asSequence(row.sequence),
    eventType: row.event_type,
    commandId: row.command_id,
    actorKind: row.actor_kind,
    actorRef: row.actor_ref,
    subjectKind: row.subject_kind,
    subjectRef: row.subject_ref,
    ruleId: row.rule_id,
    ruleVersion: row.rule_version === null ? null : asSequence(row.rule_version),
    payload: asRecord(row.payload),
    payloadHash: row.payload_hash,
    previousEventHash: row.previous_event_hash,
    eventHash: row.event_hash,
    recordedAt,
  };
}

export async function listEconomicEvents(db: Pick<EconomicDb, "query">, missionId: string) {
  const result = await db.query<EventRow>(
    `SELECT id, mission_id, sequence, event_type, command_id, actor_kind, actor_ref, subject_kind, subject_ref,
            rule_id, rule_version, payload, payload_hash, previous_event_hash, event_hash, recorded_at
       FROM economic.events WHERE mission_id = $1 ORDER BY sequence ASC`,
    [missionId],
  );
  return result.rows.map(mapEvent);
}

async function existingCommand(db: Pick<EconomicDb, "query">, command: EconomicCommand, hash: string): Promise<CommitResult | null> {
  const found = await db.query<{ id: string; canonical_hash: string }>(
    "SELECT id, canonical_hash FROM economic.commands WHERE mission_id = $1 AND idempotency_key = $2",
    [command.missionId, command.idempotencyKey],
  );
  const row = found.rows[0];
  if (!row) return null;
  if (row.canonical_hash !== hash) throw new EconomicRefusal("idempotency_conflict", "Idempotency key was already used for different content.");
  const events = await db.query<{ id: string }>("SELECT id FROM economic.events WHERE command_id = $1 ORDER BY sequence", [row.id]);
  return { status: "replayed", commandId: row.id, eventIds: events.rows.map((event) => event.id) };
}

function pgError(error: unknown) {
  if (!error || typeof error !== "object") return { code: "", constraint: "" };
  const record = error as { code?: unknown; constraint?: unknown };
  return { code: String(record.code ?? ""), constraint: String(record.constraint ?? "") };
}

export async function commitCommand(db: EconomicDb, input: unknown, ids: () => string = randomUUID, now: () => Date = () => new Date(), connection?: Pick<EconomicDb, "query">): Promise<CommitResult> {
  const command = assertCommand(input);
  let hash: string;
  try {
    hash = commandHash(command);
  } catch (error) {
    if (error instanceof CanonicalError) throw new EconomicRefusal("invalid_payload", error.message);
    throw error;
  }
  if (connection) return writeCommand(connection, command, hash, ids, now);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.transaction((tx) => writeCommand(tx, command, hash, ids, now));
    } catch (error) {
      if (error instanceof EconomicRefusal) throw error;
      const pg = pgError(error);
      if ((pg.code === "40001" || pg.code === "40P01") && attempt < 4) continue;
      if (pg.code === "23505") {
        if (pg.constraint.includes("reward")) throw new EconomicRefusal("reward_exists", "That reward was already issued.");
        const replay = await existingCommand(db, command, hash);
        if (replay) return replay;
      }
      throw error;
    }
  }
  throw new EconomicRefusal("invalid_state", "Economic command could not be committed.");
}

async function writeCommand(tx: Pick<EconomicDb, "query">, command: EconomicCommand, hash: string, ids: () => string, now: () => Date): Promise<CommitResult> {
  await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [command.missionId]);
  const replay = await existingCommand(tx, command, hash);
  if (replay) return replay;
  const history = await listEconomicEvents(tx, command.missionId);
  verifyChain(history);
  let drafts: ReturnType<typeof evaluate>;
  try {
    drafts = evaluate(history, command);
  } catch (error) {
    if (error instanceof QuantityError) throw new EconomicRefusal("amount_range", error.message);
    if (error instanceof CanonicalError) throw new EconomicRefusal("invalid_payload", error.message);
    throw error;
  }
  const commandId = ids();
  const recordedAt = now().toISOString();
  await tx.query(
    `INSERT INTO economic.commands (id, mission_id, command_type, idempotency_key, canonical_hash, canonical_payload, actor_kind, actor_ref, received_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
    [commandId, command.missionId, command.type, command.idempotencyKey, hash, canonicalize(command.payload), command.actor.kind, command.actor.ref, recordedAt],
  );
  const sealed = sealDrafts({
    missionId: command.missionId,
    commandId,
    actorKind: command.actor.kind,
    actorRef: command.actor.ref,
    drafts,
    sequenceStart: history.at(-1)?.sequence ?? 0,
    previousEventHash: history.at(-1)?.eventHash ?? null,
    ids,
    recordedAt,
  });
  for (const event of sealed) {
    await tx.query(
      `INSERT INTO economic.events (
         id, mission_id, sequence, event_type, command_id, actor_kind, actor_ref, subject_kind, subject_ref,
         rule_id, rule_version, payload, payload_hash, previous_event_hash, event_hash, recorded_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16)`,
      [
        event.id, event.missionId, event.sequence, event.eventType, event.commandId, event.actorKind, event.actorRef,
        event.subjectKind, event.subjectRef, event.ruleId, event.ruleVersion, canonicalize(event.payload),
        event.payloadHash, event.previousEventHash, event.eventHash, event.recordedAt,
      ],
    );
    if (event.eventType === "rule_published") await insertRule(tx, command, event);
    if (event.eventType === "mcu_granted" || event.eventType === "bounty_reward_granted") {
      await tx.query("INSERT INTO economic.reward_keys (mission_id, reward_key, event_id) VALUES ($1, $2, $3)", [
        event.missionId, event.payload.rewardKey, event.id,
      ]);
    }
  }
  return { status: "accepted", commandId, eventIds: sealed.map((event) => event.id) };
}

async function insertRule(tx: Pick<EconomicDb, "query">, command: EconomicCommand, event: EconomicEvent) {
  const definition = command.payload.definition;
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) throw new EconomicRefusal("invalid_payload", "Rule definition is invalid.");
  await tx.query(
    `INSERT INTO economic.rule_versions
       (mission_id, rule_id, version, rule_kind, definition, definition_hash, published_event_id, published_sequence)
     VALUES ($1, $2, $3, 'fixed_mcu_on_recognition', $4::jsonb, $5, $6, $7)`,
    [event.missionId, event.ruleId, event.ruleVersion, canonicalize(definition), event.payload.definitionHash, event.id, event.sequence],
  );
}
