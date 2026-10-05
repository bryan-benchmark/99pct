import { EconomicRefusal, type CommandType, type EconomicCommand } from "./model";

export const submitterCapabilities = ["human", "recognition", "governance", "bounty_recognition"] as const;

export type SubmitterCapability = (typeof submitterCapabilities)[number];

const channels: Record<SubmitterCapability, { actorKind: "human" | "process"; actorRef: string | null; types: readonly CommandType[] }> = {
  human: { actorKind: "human", actorRef: null, types: ["confirm_bounty_participation"] },
  recognition: { actorKind: "process", actorRef: "recognition", types: ["recognize_contribution", "adjust_mcu"] },
  governance: { actorKind: "process", actorRef: "rule-publisher", types: ["publish_rule", "activate_rule"] },
  bounty_recognition: { actorKind: "process", actorRef: "bounty-recognition", types: ["recognize_bounty_completion"] },
};

export type IntentRow = {
  id: string;
  mission_id: string;
  command_type: string;
  idempotency_key: string;
  actor_kind: string;
  actor_ref: string;
  payload: unknown;
  submitter_capability: string;
};

export function commandFromIntent(row: IntentRow): EconomicCommand {
  if (!(submitterCapabilities as readonly string[]).includes(row.submitter_capability)) {
    throw new EconomicRefusal("unauthorized", "Intent capability is not a trusted channel.");
  }
  const channel = channels[row.submitter_capability as SubmitterCapability];
  if (!(channel.types as readonly string[]).includes(row.command_type)) {
    throw new EconomicRefusal("unauthorized", "This capability cannot submit that command.");
  }
  const actorRef = channel.actorRef ?? row.actor_ref;
  if (row.actor_kind !== channel.actorKind || (channel.actorRef !== null && row.actor_ref !== channel.actorRef)) {
    throw new EconomicRefusal("unauthorized", "Intent actor does not match its capability channel.");
  }
  if (!row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) {
    throw new EconomicRefusal("invalid_payload", "Intent payload is invalid.");
  }
  return {
    missionId: row.mission_id,
    type: row.command_type as CommandType,
    idempotencyKey: row.idempotency_key,
    actor: { kind: channel.actorKind, ref: actorRef },
    payload: row.payload as EconomicCommand["payload"],
  };
}
