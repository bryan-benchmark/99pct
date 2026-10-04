import { canonicalize, sha256, type CanonicalValue } from "./canonical";
import { parseMcu } from "./quantity";

export const COMMAND_TYPES = [
  "publish_rule",
  "activate_rule",
  "recognize_contribution",
  "adjust_mcu",
  "publish_bounty_terms",
  "confirm_bounty_participation",
  "recognize_bounty_completion",
] as const;

export const EVENT_TYPES = [
  "rule_published",
  "rule_activated",
  "contribution_recognized",
  "mcu_granted",
  "mcu_adjusted",
  "bounty_terms_published",
  "bounty_participation_confirmed",
  "bounty_completion_recognized",
  "bounty_reward_granted",
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type ActorKind = "human" | "process";

export type EconomicCommand = {
  missionId: string;
  type: CommandType;
  idempotencyKey: string;
  actor: { kind: ActorKind; ref: string };
  payload: { [key: string]: CanonicalValue };
};

export type EconomicEvent = {
  id: string;
  missionId: string;
  sequence: number;
  eventType: EventType;
  commandId: string;
  actorKind: ActorKind;
  actorRef: string;
  subjectKind: string;
  subjectRef: string;
  ruleId: string | null;
  ruleVersion: number | null;
  payload: { [key: string]: CanonicalValue };
  payloadHash: string;
  previousEventHash: string | null;
  eventHash: string;
  recordedAt: string;
};

export type EventDraft = {
  eventType: EventType;
  subjectKind: string;
  subjectRef: string;
  ruleId: string | null;
  ruleVersion: number | null;
  payload: { [key: string]: CanonicalValue };
};

export class EconomicRefusal extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "EconomicRefusal";
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const refPattern = /^[a-z0-9][a-z0-9._:-]{0,80}$/;
const keyPattern = /^[A-Za-z0-9._:-]{1,200}$/;

export function assertUuid(value: string, label: string) {
  if (!uuidPattern.test(value)) throw new EconomicRefusal("invalid_payload", `${label} must be a lowercase UUID.`);
}

export function assertRef(value: string, label: string) {
  if (!refPattern.test(value) || value.includes("@")) throw new EconomicRefusal("invalid_payload", `${label} must be a public reference.`);
}

export function commandHash(command: EconomicCommand) {
  return sha256(canonicalize({
    actorKind: command.actor.kind,
    actorRef: command.actor.ref,
    format: "economic-command-v1",
    missionId: command.missionId,
    payload: command.payload,
    type: command.type,
  }));
}

export function payloadHash(payload: CanonicalValue) {
  return sha256(canonicalize(payload));
}

export function eventHash(event: Omit<EconomicEvent, "payload" | "eventHash" | "recordedAt"> & { payloadHash: string }) {
  return sha256(canonicalize({
    actorKind: event.actorKind,
    actorRef: event.actorRef,
    commandId: event.commandId,
    eventId: event.id,
    eventType: event.eventType,
    format: "economic-event-v1",
    missionId: event.missionId,
    payloadHash: event.payloadHash,
    previousEventHash: event.previousEventHash,
    ruleId: event.ruleId,
    ruleVersion: event.ruleVersion === null ? null : String(event.ruleVersion),
    sequence: String(event.sequence),
    subjectKind: event.subjectKind,
    subjectRef: event.subjectRef,
  }));
}

export function assertCommand(value: unknown): EconomicCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EconomicRefusal("invalid_payload", "Economic command is missing.");
  const record = value as Record<string, unknown>;
  if (record.kind === "ai_proposal") throw new EconomicRefusal("ai_boundary", "An AI proposal is not an economic command.");
  if (typeof record.missionId !== "string" || typeof record.type !== "string" || typeof record.idempotencyKey !== "string") {
    throw new EconomicRefusal("invalid_payload", "Economic command fields are incomplete.");
  }
  if (!(COMMAND_TYPES as readonly string[]).includes(record.type)) throw new EconomicRefusal("invalid_payload", "Economic command type is unknown.");
  if (!keyPattern.test(record.idempotencyKey)) throw new EconomicRefusal("invalid_payload", "Idempotency key is not canonical.");
  assertUuid(record.missionId, "Mission");
  const actor = record.actor as { kind?: unknown; ref?: unknown } | undefined;
  if (!actor || (actor.kind !== "human" && actor.kind !== "process") || typeof actor.ref !== "string") {
    throw new EconomicRefusal("unauthorized", "Economic actor is not authorized.");
  }
  assertRef(actor.ref, "Actor");
  if (!record.payload || typeof record.payload !== "object" || Array.isArray(record.payload)) {
    throw new EconomicRefusal("invalid_payload", "Economic command payload is invalid.");
  }
  return {
    missionId: record.missionId,
    type: record.type as CommandType,
    idempotencyKey: record.idempotencyKey,
    actor: { kind: actor.kind, ref: actor.ref },
    payload: record.payload as EconomicCommand["payload"],
  };
}

export function positiveVersion(payload: { [key: string]: CanonicalValue }, key: string) {
  const value = payload[key];
  if (typeof value !== "string") throw new EconomicRefusal("invalid_payload", "Rule version must be an integer string.");
  const version = parseMcu(value);
  if (version < BigInt(1) || version > BigInt(Number.MAX_SAFE_INTEGER)) throw new EconomicRefusal("amount_range", "Rule version is outside the safe range.");
  return Number(version);
}
