import { assertCanonical, canonicalize, sha256, type CanonicalValue } from "../canonical";
import { verifyChain } from "../chain";
import { foldState } from "../engine/evaluate";
import { commandHash, eventHash, payloadHash, type CommandType, type EconomicEvent, type EventType } from "../model";
import { parseMcu } from "../quantity";

export type Verification = { ok: true; events: EconomicEvent[] } | { ok: false; errors: string[] };

type Parsed = { [key: string]: CanonicalValue };

function record(value: unknown): Parsed | null {
  try {
    assertCanonical(value);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function text(row: Parsed, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function bindPublishedRules(rules: Map<string, Parsed>, events: EconomicEvent[], missionId: string, errors: string[]) {
  const publications = new Set<string>();
  for (const rule of rules.values()) {
    const event = events.find((item) => item.id === text(rule, "publishedEventId"));
    if (!event || event.eventType !== "rule_published") {
      errors.push("Rule publication event is missing.");
      continue;
    }
    if (String(event.sequence) !== text(rule, "publishedSequence") || event.missionId !== missionId || event.ruleId !== text(rule, "ruleId") || String(event.ruleVersion) !== text(rule, "version")) {
      errors.push("Rule publication does not match the event.");
    }
    const definition = rule.definition;
    if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
      errors.push("Rule definition is not canonical.");
      continue;
    }
    if (event.payload.definitionHash !== text(rule, "definitionHash")
      || event.payload.amount !== definition.amount
      || event.payload.kind !== definition.kind
      || event.payload.scale !== definition.scale
      || event.payload.ruleId !== text(rule, "ruleId")
      || event.payload.version !== text(rule, "version")) {
      errors.push("Rule publication does not match the event.");
    }
    if (publications.has(event.id)) errors.push("Rule publication is duplicated.");
    publications.add(event.id);
  }
  for (const event of events) {
    if (event.eventType === "rule_published" && !publications.has(event.id)) errors.push("Rule publication event is missing a rule record.");
  }
}

export function verifyExport(contents: string): Verification {
  const errors: string[] = [];
  const lines = contents.split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) return { ok: false, errors: ["Export is empty."] };
  let parsed: unknown[];
  try {
    parsed = lines.map((line) => JSON.parse(line) as unknown);
  } catch {
    return { ok: false, errors: ["Export is not canonical NDJSON."] };
  }
  const rows = parsed.map((line) => record(line));
  if (rows.some((row) => !row)) return { ok: false, errors: ["Export contains non-canonical or private fields."] };
  const header = rows[0] as Parsed;
  if (header.format !== "economic-export-v1" || typeof header.missionId !== "string") return { ok: false, errors: ["Export format version is missing."] };
  const missionId = header.missionId;
  let phase: "rule" | "command" | "event" = "rule";
  const rules = new Map<string, Parsed>();
  const commands = new Map<string, Parsed>();
  const events: EconomicEvent[] = [];
  const rewardKeys = new Set<string>();
  for (const row of rows.slice(1) as Parsed[]) {
    const kind = text(row, "record");
    if (kind === "rule" && phase === "rule") {
      const key = `${text(row, "ruleId")}:${text(row, "version")}`;
      if (rules.has(key)) errors.push("Rule version is duplicated.");
      if (text(row, "missionId") !== missionId) errors.push("Rule belongs to another Mission.");
      try {
        if (text(row, "definitionHash") !== sha256(canonicalize(row.definition))) errors.push("Rule definition hash does not match.");
      } catch {
        errors.push("Rule definition is not canonical.");
      }
      rules.set(key, row);
    } else if (kind === "command" && (phase === "rule" || phase === "command")) {
      phase = "command";
      const id = text(row, "id");
      if (!id || commands.has(id)) errors.push("Command receipt is duplicated.");
      if (text(row, "missionId") !== missionId) errors.push("Command belongs to another Mission.");
      const idempotency = text(row, "idempotencyKey");
      if (idempotency && [...commands.values()].some((command) => command.idempotencyKey === idempotency)) errors.push("Idempotency key is duplicated.");
      const actorKind = text(row, "actorKind");
      const payload = row.payload;
      if ((actorKind !== "human" && actorKind !== "process") || !payload || typeof payload !== "object" || Array.isArray(payload)) {
        errors.push("Command receipt is not canonical.");
      } else {
        const hash = commandHash({
          missionId,
          type: (text(row, "commandType") ?? "") as CommandType,
          idempotencyKey: idempotency ?? "",
          actor: { kind: actorKind, ref: text(row, "actorRef") ?? "" },
          payload,
        });
        if (hash !== text(row, "canonicalHash")) errors.push("Command hash does not match.");
      }
      if (id) commands.set(id, row);
    } else if (kind === "event" && phase !== "rule") {
      phase = "event";
      const payload = row.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        errors.push("Event payload is invalid.");
        continue;
      }
      const sequence = Number(text(row, "sequence"));
      const ruleVersion = row.ruleVersion === null ? null : Number(text(row, "ruleVersion"));
      const event: EconomicEvent = {
        id: text(row, "id") ?? "",
        missionId: text(row, "missionId") ?? "",
        sequence,
        eventType: text(row, "eventType") as EventType,
        commandId: text(row, "commandId") ?? "",
        actorKind: text(row, "actorKind") === "human" ? "human" : "process",
        actorRef: text(row, "actorRef") ?? "",
        subjectKind: text(row, "subjectKind") ?? "",
        subjectRef: text(row, "subjectRef") ?? "",
        ruleId: row.ruleId === null ? null : text(row, "ruleId"),
        ruleVersion,
        payload,
        payloadHash: text(row, "payloadHash") ?? "",
        previousEventHash: row.previousEventHash === null ? null : text(row, "previousEventHash"),
        eventHash: text(row, "eventHash") ?? "",
        recordedAt: text(row, "recordedAt") ?? "",
      };
      if (event.missionId !== missionId) errors.push("Event belongs to another Mission.");
      if (!commands.has(event.commandId)) errors.push("Event cites a missing command.");
      if (event.ruleId !== null) {
        const rule = rules.get(`${event.ruleId}:${event.ruleVersion}`);
        if (!rule) errors.push("Event cites a missing rule version.");
      }
      if (payloadHash(event.payload) !== event.payloadHash) errors.push("Event payload hash does not match.");
      if (eventHash(event) !== event.eventHash) errors.push("Event hash does not match.");
      const rewardKey = payload.rewardKey;
      if (typeof rewardKey === "string") {
        if (rewardKeys.has(rewardKey)) errors.push("Reward key is duplicated.");
        rewardKeys.add(rewardKey);
      }
      if (typeof payload.amount === "string") {
        try { parseMcu(payload.amount); } catch { errors.push("MCU amount is invalid."); }
      }
      if (typeof payload.delta === "string") {
        try { parseMcu(payload.delta); } catch { errors.push("MCU amount is invalid."); }
      }
      events.push(event);
    } else {
      errors.push("Export records are out of order.");
    }
  }
  bindPublishedRules(rules, events, missionId, errors);
  try {
    verifyChain(events);
    foldState(events);
  } catch {
    errors.push("Event chain does not verify.");
  }
  return errors.length === 0 ? { ok: true, events } : { ok: false, errors: [...new Set(errors)] };
}
