import type { ClaimId } from "@/protocol/canonical";
import type { NonCanonicalMaturity } from "./protocolMeta";

/** Explanatory catalog — claim text comes only from spec/canonical.json. */
export type PrincipleEntry = {
  kind: "principle" | "constraint";
  claimId: ClaimId;
  title: string;
  /** Website prose — must NOT be marked Canonical. */
  explanation: string;
};

export const principleEntries: PrincipleEntry[] = [
  {
    kind: "principle",
    claimId: "purpose",
    title: "Why Missionism exists",
    explanation:
      "The purpose statement is the aim of the protocol. It is not a completeness test by itself.",
  },
  {
    kind: "principle",
    claimId: "tripleAlignment",
    title: "Alignment completeness test",
    explanation:
      "Use this as a design test: if contributor, organization, and customer or beneficiary incentives diverge, the design is unfinished.",
  },
  {
    kind: "principle",
    claimId: "noPermanentEntitlement",
    title: "Mission over permanent entitlement",
    explanation:
      "Organizations exist to accomplish something. Arrival order is not a permanent title to future value that other people create.",
  },
  {
    kind: "principle",
    claimId: "measurableMission",
    title: "Missions are measurable",
    explanation:
      "Normally expressible as increase X or decrease X. Financial size alone does not define the mission.",
  },
  {
    kind: "principle",
    claimId: "missionRecursion",
    title: "Missions are recursive",
    explanation:
      "Larger missions can contain smaller ones. Semi-autonomy at each node is compatible with contribution upward.",
  },
  {
    kind: "principle",
    claimId: "missionAutonomy",
    title: "Child missions keep autonomy",
    explanation:
      "Joining a parent mission need not mean surrendering product, hiring, or internal allocation.",
  },
  {
    kind: "principle",
    claimId: "forkability",
    title: "Forking is a feature",
    explanation:
      "Disagreement should produce forks, not capture of the governing organization. Canonical naming stays versioned.",
  },
  {
    kind: "principle",
    claimId: "surviveFounder",
    title: "Missionism should survive its founder",
    explanation:
      "The protocol is not finished ideology. Better versions should be free to win on merit.",
  },
  {
    kind: "constraint",
    claimId: "contributorPath",
    title: "Later contributors need a path to ownership",
    explanation:
      "Exact instruments (equity, units, profit share, trusts) are mechanisms. The constraint is that a real path exists.",
  },
  {
    kind: "constraint",
    claimId: "voluntaryAdoption",
    title: "Voluntary adoption",
    explanation:
      "Missionism does not decide which lawful missions people must pursue, or what a worthwhile life is.",
  },
];

export const mechanismExample = {
  claimIdPrinciple: "noPermanentEntitlement" as ClaimId,
  claimIdConstraint: "contributorPath" as ClaimId,
  mechanism: "Continuously issued contributor equity.",
  mechanismMaturity: "proposed" as NonCanonicalMaturity,
  alternatives: [
    "Trust ownership",
    "Cooperative shares",
    "Mission units",
    "Profit participation",
  ],
};

/**
 * Proposed design principle — not yet in canonical.json.
 * Candidate for Canonical after experiments show it holds as a design test.
 */
export const alignmentCompression = {
  title: "Alignment is compression",
  maturity: "proposed" as NonCanonicalMaturity,
  thesis:
    "Organizations become complicated when people must constantly be persuaded, monitored or forced to act in the organization’s interest.",
  body: [
    "Rules can manage misalignment. They do not eliminate it.",
    "The better solution is to make more of the desired behavior individually rational.",
    "A good organizational mechanism should therefore remove more coordination than it creates.",
    "If Missionism requires endless committees to determine who deserves what, it has failed.",
    "If a small number of ownership rules cause thousands of independent decisions to point toward the mission without central permission, it is working.",
  ],
  punch:
    "The goal is not more governance. It is less governance made possible by better alignment.",
  designTest:
    "Every mechanism must remove more coordination complexity than it adds.",
};

/** Shared with principles page — explanatory, not normative. */
export const nonDecisions = [
  "what missions people must pursue",
  "what a worthwhile life is",
  "which religion or philosophy is correct",
  "which lawful mission someone must join",
  "how every organization must measure value",
] as const;
