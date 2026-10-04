import { EconomicRefusal, assertCommand, type EconomicCommand } from "../model";

export type AiProposal = {
  kind: "ai_proposal";
  missionId: string;
  proposedType: string;
  proposedPayload: Record<string, string>;
  modelNote: string;
};

export function authorizeAiProposal(proposal: AiProposal, authorizer: { kind: "process"; ref: string }, idempotencyKey: string): EconomicCommand {
  if (proposal.kind !== "ai_proposal") throw new EconomicRefusal("ai_boundary", "An AI proposal is not an economic command.");
  if (authorizer.kind !== "process" || authorizer.ref !== "recognition") {
    throw new EconomicRefusal("unauthorized", "An AI proposal needs a recognition authorizer.");
  }
  if (proposal.proposedType !== "recognize_contribution") {
    throw new EconomicRefusal("ai_boundary", "This AI proposal cannot be converted into an economic command.");
  }
  return assertCommand({
    missionId: proposal.missionId,
    type: proposal.proposedType,
    idempotencyKey,
    actor: authorizer,
    payload: proposal.proposedPayload,
  });
}
