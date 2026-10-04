import { MCU_SCALE, parseMcu } from "../quantity";
import {
  EconomicRefusal,
  assertRef,
  assertUuid,
  payloadHash,
  positiveVersion,
  type EconomicCommand,
  type EconomicEvent,
  type EventDraft,
  type EventType,
} from "../model";
import type { CanonicalValue } from "../canonical";

type RuleDefinition = { amount: bigint; hash: string };
type BountyTerms = { ruleId: string; ruleVersion: number; termsHash: string };

export type EconomicState = {
  rules: Map<string, Map<number, RuleDefinition>>;
  active: Map<string, number>;
  contributions: Set<string>;
  rewardKeys: Set<string>;
  grants: Map<string, { beneficiaryRef: string; amount: bigint }>;
  bounties: Map<string, BountyTerms>;
  participants: Set<string>;
  completions: Set<string>;
};

function text(payload: { [key: string]: CanonicalValue }, key: string) {
  const value = payload[key];
  if (typeof value !== "string") throw new EconomicRefusal("invalid_payload", `${key} is required.`);
  return value;
}

function exactKeys(payload: { [key: string]: CanonicalValue }, keys: string[]) {
  const actual = Object.keys(payload).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new EconomicRefusal("invalid_payload", "Economic payload fields do not match the command.");
  }
}

export function emptyState(): EconomicState {
  return {
    rules: new Map(),
    active: new Map(),
    contributions: new Set(),
    rewardKeys: new Set(),
    grants: new Map(),
    bounties: new Map(),
    participants: new Set(),
    completions: new Set(),
  };
}

export function foldState(events: EconomicEvent[]) {
  const state = emptyState();
  for (const event of events) applyEvent(state, event);
  return state;
}

function applyEvent(state: EconomicState, event: EconomicEvent) {
  if (event.eventType === "rule_published") {
    exactKeys(event.payload, ["amount", "definitionHash", "kind", "ruleId", "scale", "version"]);
    const ruleId = text(event.payload, "ruleId");
    const version = positiveVersion(event.payload, "version");
    const versions = state.rules.get(ruleId) ?? new Map();
    versions.set(version, { amount: parseMcu(text(event.payload, "amount")), hash: text(event.payload, "definitionHash") });
    state.rules.set(ruleId, versions);
  } else if (event.eventType === "rule_activated") {
    state.active.set(text(event.payload, "ruleId"), positiveVersion(event.payload, "version"));
  } else if (event.eventType === "contribution_recognized") {
    state.contributions.add(text(event.payload, "contributionRef"));
  } else if (event.eventType === "mcu_granted" || event.eventType === "bounty_reward_granted") {
    const rewardKey = text(event.payload, "rewardKey");
    state.rewardKeys.add(rewardKey);
    state.grants.set(event.id, { beneficiaryRef: text(event.payload, "beneficiaryRef"), amount: parseMcu(text(event.payload, "amount")) });
  } else if (event.eventType === "mcu_adjusted") {
    const original = state.grants.get(text(event.payload, "originalEventId"));
    if (!original) throw new EconomicRefusal("broken_history", "Adjustment history is missing its original grant.");
    state.grants.set(event.id, { beneficiaryRef: original.beneficiaryRef, amount: parseMcu(text(event.payload, "delta")) });
  } else if (event.eventType === "bounty_terms_published") {
    state.bounties.set(text(event.payload, "bountyRef"), {
      ruleId: text(event.payload, "ruleId"),
      ruleVersion: positiveVersion(event.payload, "ruleVersion"),
      termsHash: text(event.payload, "termsHash"),
    });
  } else if (event.eventType === "bounty_participation_confirmed") {
    state.participants.add(`${text(event.payload, "bountyRef")}:${text(event.payload, "beneficiaryRef")}`);
  } else if (event.eventType === "bounty_completion_recognized") {
    state.completions.add(`${text(event.payload, "bountyRef")}:${text(event.payload, "beneficiaryRef")}:${text(event.payload, "completionRef")}`);
  } else {
    throw new EconomicRefusal("broken_history", "Economic history contains an unknown event.");
  }
}

function actorAllowed(command: EconomicCommand) {
  const expected: Record<EconomicCommand["type"], { kind: "human" | "process"; ref?: string }> = {
    publish_rule: { kind: "process", ref: "rule-publisher" },
    activate_rule: { kind: "process", ref: "rule-publisher" },
    recognize_contribution: { kind: "process", ref: "recognition" },
    adjust_mcu: { kind: "process", ref: "recognition" },
    publish_bounty_terms: { kind: "process", ref: "bounty-publisher" },
    confirm_bounty_participation: { kind: "human" },
    recognize_bounty_completion: { kind: "process", ref: "bounty-recognition" },
  };
  const rule = expected[command.type];
  if (command.actor.kind !== rule.kind || (rule.ref && command.actor.ref !== rule.ref)) {
    throw new EconomicRefusal("unauthorized", "This actor cannot submit that economic command.");
  }
}

function ruleDefinition(payload: { [key: string]: CanonicalValue }) {
  exactKeys(payload, ["amount", "kind", "scale"]);
  if (payload.kind !== "fixed_mcu_on_recognition") throw new EconomicRefusal("unknown_rule", "Only the fixed recognition rule is implemented.");
  if (payload.scale !== String(MCU_SCALE)) throw new EconomicRefusal("invalid_payload", "MCU scale does not match the kernel scale.");
  const amount = parseMcu(text(payload, "amount"));
  if (amount < BigInt(1)) throw new EconomicRefusal("amount_range", "MCU grant amount must be positive.");
  return { amount, hash: payloadHash(payload) };
}

function draft(eventType: EventType, subjectKind: string, subjectRef: string, ruleId: string | null, ruleVersion: number | null, payload: { [key: string]: CanonicalValue }): EventDraft {
  return { eventType, subjectKind, subjectRef, ruleId, ruleVersion, payload };
}

export function evaluate(history: EconomicEvent[], command: EconomicCommand): EventDraft[] {
  if (history.some((event) => event.missionId !== command.missionId)) throw new EconomicRefusal("wrong_mission", "Economic history crossed a Mission boundary.");
  actorAllowed(command);
  const state = foldState(history);
  if (command.type === "publish_rule") return publishRule(command, state);
  if (command.type === "activate_rule") return activateRule(command, state);
  if (command.type === "recognize_contribution") return recognizeContribution(command, state);
  if (command.type === "adjust_mcu") return adjustMcu(history, command, state);
  if (command.type === "publish_bounty_terms") return publishBounty(command, state);
  if (command.type === "confirm_bounty_participation") return confirmParticipation(command, state);
  return recognizeBounty(command, state);
}

function publishRule(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["definition", "ruleId", "version"]);
  const ruleId = text(command.payload, "ruleId");
  assertRef(ruleId, "Rule");
  const version = positiveVersion(command.payload, "version");
  if (state.rules.get(ruleId)?.has(version)) throw new EconomicRefusal("invalid_state", "That rule version is already published.");
  const definition = command.payload.definition;
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) throw new EconomicRefusal("invalid_payload", "Rule definition is invalid.");
  const parsed = ruleDefinition(definition);
  return [draft("rule_published", "rule", ruleId, ruleId, version, {
    amount: parsed.amount.toString(),
    definitionHash: parsed.hash,
    kind: "fixed_mcu_on_recognition",
    ruleId,
    scale: String(MCU_SCALE),
    version: String(version),
  })];
}

function activateRule(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["ruleId", "version"]);
  const ruleId = text(command.payload, "ruleId");
  const version = positiveVersion(command.payload, "version");
  if (!state.rules.get(ruleId)?.has(version)) throw new EconomicRefusal("unknown_rule", "That rule version is not published.");
  if (state.active.get(ruleId) === version) throw new EconomicRefusal("invalid_state", "That rule version is already active.");
  return [draft("rule_activated", "rule", ruleId, ruleId, version, { ruleId, version: String(version) })];
}

function activeRule(state: EconomicState, ruleId: string, version: number) {
  const definition = state.rules.get(ruleId)?.get(version);
  if (!definition) throw new EconomicRefusal("unknown_rule", "That rule version is not published.");
  if (state.active.get(ruleId) !== version) throw new EconomicRefusal("inactive_rule", "That rule version is not active.");
  return definition;
}

function recognizeContribution(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["contributionRef", "contributorRef", "evidenceRef", "ruleId", "ruleVersion"]);
  const contributionRef = text(command.payload, "contributionRef");
  const contributorRef = text(command.payload, "contributorRef");
  const evidenceRef = text(command.payload, "evidenceRef");
  const ruleId = text(command.payload, "ruleId");
  assertRef(contributionRef, "Contribution");
  assertRef(contributorRef, "Contributor");
  assertRef(evidenceRef, "Evidence");
  const version = positiveVersion(command.payload, "ruleVersion");
  const definition = activeRule(state, ruleId, version);
  if (state.contributions.has(contributionRef)) throw new EconomicRefusal("invalid_state", "That contribution was already recognized.");
  const rewardKey = `contribution:${command.missionId}:${contributionRef}:${contributorRef}`;
  if (state.rewardKeys.has(rewardKey)) throw new EconomicRefusal("reward_exists", "That contribution reward was already issued.");
  return [
    draft("contribution_recognized", "contribution", contributionRef, null, null, { contributionRef, contributorRef, evidenceRef }),
    draft("mcu_granted", "contributor", contributorRef, ruleId, version, {
      amount: definition.amount.toString(),
      beneficiaryRef: contributorRef,
      contributionRef,
      evidenceRef,
      rewardKey,
      ruleId,
      ruleVersion: String(version),
    }),
  ];
}

function adjustMcu(history: EconomicEvent[], command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["delta", "originalEventId", "reasonRef"]);
  const originalEventId = text(command.payload, "originalEventId");
  const reasonRef = text(command.payload, "reasonRef");
  assertUuid(originalEventId, "Original event");
  assertRef(reasonRef, "Reason");
  const delta = parseMcu(text(command.payload, "delta"));
  if (delta === BigInt(0)) throw new EconomicRefusal("amount_range", "An MCU adjustment cannot be zero.");
  const original = history.find((event) => event.id === originalEventId && (event.eventType === "mcu_granted" || event.eventType === "mcu_adjusted"));
  if (!original) throw new EconomicRefusal("invalid_state", "Adjustment must reference an MCU grant or adjustment.");
  const beneficiaryRef = text(original.payload, "beneficiaryRef");
  if (!state.grants.has(original.id)) throw new EconomicRefusal("broken_history", "Adjustment history is missing its original grant.");
  return [draft("mcu_adjusted", "contributor", beneficiaryRef, null, null, {
    beneficiaryRef,
    delta: delta.toString(),
    originalEventId,
    reasonRef,
  })];
}

function publishBounty(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["bountyRef", "ruleId", "ruleVersion", "terms"]);
  const bountyRef = text(command.payload, "bountyRef");
  const ruleId = text(command.payload, "ruleId");
  assertRef(bountyRef, "Bounty");
  const version = positiveVersion(command.payload, "ruleVersion");
  if (!state.rules.get(ruleId)?.has(version)) throw new EconomicRefusal("unknown_rule", "Bounty terms cite an unpublished rule.");
  if (state.bounties.has(bountyRef)) throw new EconomicRefusal("invalid_state", "Bounty terms are already published.");
  const terms = command.payload.terms;
  if (!terms || typeof terms !== "object" || Array.isArray(terms)) throw new EconomicRefusal("invalid_payload", "Bounty terms are invalid.");
  exactKeys(terms, ["milestone"]);
  if (terms.milestone !== "completion") throw new EconomicRefusal("invalid_payload", "The reference bounty milestone is completion.");
  return [draft("bounty_terms_published", "bounty", bountyRef, ruleId, version, {
    bountyRef,
    ruleId,
    ruleVersion: String(version),
    termsHash: payloadHash(terms),
  })];
}

function confirmParticipation(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["beneficiaryRef", "bountyRef"]);
  const bountyRef = text(command.payload, "bountyRef");
  const beneficiaryRef = text(command.payload, "beneficiaryRef");
  assertRef(bountyRef, "Bounty");
  assertRef(beneficiaryRef, "Beneficiary");
  if (command.actor.ref !== beneficiaryRef) throw new EconomicRefusal("unauthorized", "A human can confirm only their own participation.");
  if (!state.bounties.has(bountyRef)) throw new EconomicRefusal("invalid_state", "Bounty terms are not published.");
  const key = `${bountyRef}:${beneficiaryRef}`;
  if (state.participants.has(key)) throw new EconomicRefusal("invalid_state", "Participation is already confirmed.");
  return [draft("bounty_participation_confirmed", "bounty", bountyRef, null, null, { beneficiaryRef, bountyRef })];
}

function recognizeBounty(command: EconomicCommand, state: EconomicState): EventDraft[] {
  exactKeys(command.payload, ["beneficiaryRef", "bountyRef", "completionRef", "evidenceRef"]);
  const bountyRef = text(command.payload, "bountyRef");
  const beneficiaryRef = text(command.payload, "beneficiaryRef");
  const completionRef = text(command.payload, "completionRef");
  const evidenceRef = text(command.payload, "evidenceRef");
  assertRef(bountyRef, "Bounty");
  assertRef(beneficiaryRef, "Beneficiary");
  assertRef(completionRef, "Completion");
  assertRef(evidenceRef, "Evidence");
  const terms = state.bounties.get(bountyRef);
  if (!terms) throw new EconomicRefusal("invalid_state", "Bounty terms are not published.");
  if (!state.participants.has(`${bountyRef}:${beneficiaryRef}`)) throw new EconomicRefusal("invalid_state", "Bounty participation is not confirmed.");
  const completionKey = `${bountyRef}:${beneficiaryRef}:${completionRef}`;
  if (state.completions.has(completionKey)) throw new EconomicRefusal("invalid_state", "That completion was already recognized.");
  const definition = state.rules.get(terms.ruleId)?.get(terms.ruleVersion);
  if (!definition) throw new EconomicRefusal("unknown_rule", "Bounty terms cite a missing rule version.");
  const rewardKey = `${command.missionId}:${bountyRef}:${beneficiaryRef}:${completionRef}`;
  if (state.rewardKeys.has(rewardKey)) throw new EconomicRefusal("reward_exists", "That bounty reward was already issued.");
  return [
    draft("bounty_completion_recognized", "bounty", bountyRef, null, null, { beneficiaryRef, bountyRef, completionRef, evidenceRef }),
    draft("bounty_reward_granted", "contributor", beneficiaryRef, terms.ruleId, terms.ruleVersion, {
      amount: definition.amount.toString(),
      beneficiaryRef,
      bountyRef,
      completionRef,
      evidenceRef,
      rewardKey,
      ruleId: terms.ruleId,
      ruleVersion: String(terms.ruleVersion),
    }),
  ];
}
