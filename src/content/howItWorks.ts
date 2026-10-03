import type { NonCanonicalMaturity } from "./protocolMeta";

/** Explanatory questions — not normative claim text. */
export const modelSteps: { label: string; question: string }[] = [
  { label: "Mission", question: "What are we trying to accomplish?" },
  { label: "Value", question: "What actually advances the mission?" },
  { label: "Contribution", question: "Who created that value?" },
  { label: "Ownership", question: "How should enduring value be distributed?" },
  { label: "Governance", question: "Who gets to change the system?" },
  { label: "Fork", question: "What happens when we fundamentally disagree?" },
];

/** Illustrative numbers — not a prescription. */
export const workedExample = {
  disclaimer:
    "The numbers below are illustrative. They explain the idea. They are not a required ownership formula.",
  year0: [
    ["Alice", "40%"],
    ["Ben", "30%"],
    ["Cara", "20%"],
    ["Pool", "10%"],
  ] as [string, string][],
  year5: [
    ["Alice", "18%"],
    ["Ben", "11%"],
    ["Cara", "8%"],
    ["Later contributors", "53%"],
    ["Unallocated", "10%"],
  ] as [string, string][],
  punchline: [
    "Nobody had their shares taken away.",
    "New ownership was issued as new enduring value was created.",
  ],
  federation: {
    autonomy: ["product", "hiring", "internal allocation"],
    upstream: [
      "shared standards",
      "research",
      "infrastructure",
      "federation governance",
    ],
  },
};

export const nestedTree = `MISSIONISM
    │
    ├── Healthcare
    │      │
    │      ├── Benchmark
    │      ├── Hospice Access
    │      └── Nursing Education
    │
    ├── Education
    │
    └── Climate`;

export const federationNote = {
  maturity: "proposed" as NonCanonicalMaturity,
  problem:
    "Different missions need representation without allowing giant missions to control everything, or tiny missions to have disproportionate control.",
  sketch: `CONTRIBUTOR REPRESENTATION
Power based on contribution / ownership / value created

+

MISSION REPRESENTATION
Recognized missions receive independent representation

↓

Certain major decisions require agreement from both`,
  status:
    "This bicameral sketch is a proposed direction for experimentation—not a canonical requirement. The detailed mechanism remains open.",
  proposalPath: "docs/proposals/bicameral-representation.md",
};
