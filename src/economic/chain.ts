import { EconomicRefusal, eventHash, payloadHash, type EconomicEvent, type EventDraft } from "./model";

export function sealDrafts(input: {
  missionId: string;
  commandId: string;
  actorKind: EconomicEvent["actorKind"];
  actorRef: string;
  drafts: EventDraft[];
  sequenceStart: number;
  previousEventHash: string | null;
  ids: () => string;
  recordedAt: string;
}) {
  const sealed: EconomicEvent[] = [];
  let previous = input.previousEventHash;
  let sequence = input.sequenceStart;
  for (const draft of input.drafts) {
    sequence += 1;
    const id = input.ids();
    const hashedPayload = payloadHash(draft.payload);
    const partial = {
      id,
      missionId: input.missionId,
      sequence,
      eventType: draft.eventType,
      commandId: input.commandId,
      actorKind: input.actorKind,
      actorRef: input.actorRef,
      subjectKind: draft.subjectKind,
      subjectRef: draft.subjectRef,
      ruleId: draft.ruleId,
      ruleVersion: draft.ruleVersion,
      payloadHash: hashedPayload,
      previousEventHash: previous,
    };
    const event: EconomicEvent = { ...partial, payload: draft.payload, eventHash: eventHash(partial), recordedAt: input.recordedAt };
    sealed.push(event);
    previous = event.eventHash;
  }
  return sealed;
}

export function verifyChain(events: EconomicEvent[]) {
  let previous: string | null = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.sequence !== index + 1) throw new EconomicRefusal("broken_history", "Economic sequence is not contiguous.");
    if (event.previousEventHash !== previous) throw new EconomicRefusal("broken_history", "Economic previous hash does not match.");
    if (payloadHash(event.payload) !== event.payloadHash) throw new EconomicRefusal("broken_history", "Economic payload hash does not match.");
    if (eventHash(event) !== event.eventHash) throw new EconomicRefusal("broken_history", "Economic event hash does not match.");
    previous = event.eventHash;
  }
}
