import { firstRecognitionRule } from "../first-rule";
import type { SignedCheckpoint } from "./checkpoint";
import { verifyAnchoredExport } from "../verify/verify";

export type VerifiedGrant = {
  contributionId: string;
  amount: string;
  ruleId: string;
  ruleVersion: string;
  eventId: string;
  checkpointSequence: string;
};

const contributionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function grantsFromVerifiedCheckpoint(
  exported: string,
  signed: SignedCheckpoint,
  trustedPublicKeyPem: string,
  trustedSignerRef: string,
): VerifiedGrant[] {
  if (signed.checkpoint.signerRef !== trustedSignerRef) return [];
  const verified = verifyAnchoredExport(exported, signed, trustedPublicKeyPem);
  if (!verified.ok) return [];
  const grants: VerifiedGrant[] = [];
  for (const event of verified.events) {
    if (event.eventType !== "mcu_granted") continue;
    const amount = event.payload.amount;
    const ruleId = event.payload.ruleId;
    const ruleVersion = event.payload.ruleVersion;
    const contributionRef = event.payload.contributionRef;
    if (amount !== firstRecognitionRule.amount || ruleId !== firstRecognitionRule.ruleId || ruleVersion !== firstRecognitionRule.version) continue;
    if (typeof contributionRef !== "string" || !contributionRef.startsWith("contribution:")) continue;
    const contributionId = contributionRef.slice("contribution:".length);
    if (!contributionIdPattern.test(contributionId)) continue;
    grants.push({
      contributionId,
      amount,
      ruleId,
      ruleVersion,
      eventId: event.id,
      checkpointSequence: signed.checkpoint.lastSequence,
    });
  }
  return grants;
}
