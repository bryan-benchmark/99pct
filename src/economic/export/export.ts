import { canonicalize, type CanonicalValue } from "../canonical";
import type { EconomicDb } from "../db/client";
import { listEconomicEvents } from "../db/commit";
import { assertUuid } from "../model";

type RuleRow = {
  rule_id: string;
  version: string | number;
  rule_kind: string;
  definition: CanonicalValue;
  definition_hash: string;
};

type CommandRow = {
  id: string;
  command_type: string;
  idempotency_key: string;
  canonical_hash: string;
  canonical_payload: CanonicalValue;
  actor_kind: string;
  actor_ref: string;
  received_at: Date | string;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function exportMission(db: EconomicDb, missionId: string) {
  assertUuid(missionId, "Mission");
  const rules = await db.query<RuleRow>(
    `SELECT rule_id, version, rule_kind, definition, definition_hash
       FROM economic.rule_versions WHERE mission_id = $1 ORDER BY rule_id, version`,
    [missionId],
  );
  const commands = await db.query<CommandRow>(
    `SELECT id, command_type, idempotency_key, canonical_hash, canonical_payload, actor_kind, actor_ref, received_at
       FROM economic.commands WHERE mission_id = $1 ORDER BY received_at, id`,
    [missionId],
  );
  const events = await listEconomicEvents(db, missionId);
  const lines = [
    canonicalize({ format: "economic-export-v1", missionId }),
    ...rules.rows.map((rule) => canonicalize({
      definition: rule.definition,
      definitionHash: rule.definition_hash,
      missionId,
      record: "rule",
      ruleId: rule.rule_id,
      ruleKind: rule.rule_kind,
      version: String(rule.version),
    })),
    ...commands.rows.map((command) => canonicalize({
      actorKind: command.actor_kind,
      actorRef: command.actor_ref,
      canonicalHash: command.canonical_hash,
      commandType: command.command_type,
      id: command.id,
      idempotencyKey: command.idempotency_key,
      missionId,
      payload: command.canonical_payload,
      receivedAt: iso(command.received_at),
      record: "command",
    })),
    ...events.map((event) => canonicalize({
      actorKind: event.actorKind,
      actorRef: event.actorRef,
      commandId: event.commandId,
      eventHash: event.eventHash,
      eventType: event.eventType,
      id: event.id,
      missionId: event.missionId,
      payload: event.payload,
      payloadHash: event.payloadHash,
      previousEventHash: event.previousEventHash,
      record: "event",
      recordedAt: event.recordedAt,
      ruleId: event.ruleId,
      ruleVersion: event.ruleVersion === null ? null : String(event.ruleVersion),
      sequence: String(event.sequence),
      subjectKind: event.subjectKind,
      subjectRef: event.subjectRef,
    })),
  ];
  return `${lines.join("\n")}\n`;
}
