export const openVsCanonical = {
  open: [
    "philosophy",
    "specification text (forkable)",
    "documentation",
    "value-equation frameworks",
    "governance models",
    "reference software",
    "research",
    "ability to fork",
  ],
  canonical: [
    "official Missionism specification versions",
    "compatibility claims",
    "certification",
    "the official Missionism name and brand",
  ],
};

export const maturityExplainer = [
  {
    label: "Canonical",
    body: "Required to call an implementation Missionism-compatible. Short claims live only in spec/canonical.json.",
  },
  {
    label: "Proposed",
    body: "Preferred direction, but not yet part of the canonical protocol.",
  },
  {
    label: "Experimental",
    body: "Something we actively want implementations to test.",
  },
  {
    label: "Open",
    body: "Problem identified; no preferred solution yet.",
  },
] as const;

export const leanSpecFiles = [
  { path: "spec/canonical.json", role: "Normative short claims (single source)" },
  { path: "spec/CORE.md", role: "Constitutional index and context" },
  {
    path: "spec/RIGHTS_AND_CONSTRAINTS.md",
    role: "Human constraints; what Missionism does not decide",
  },
  { path: "spec/MISSIONS.md", role: "Missions, parent/child, recursion" },
  { path: "spec/VALUE.md", role: "Value requirements vs open measurement" },
  { path: "spec/OWNERSHIP.md", role: "Ownership constraints and deep design" },
  { path: "spec/GOVERNANCE.md", role: "Governance" },
  { path: "spec/FORKING.md", role: "Fork as feature; canonical name protected" },
  {
    path: "spec/COMPATIBILITY.md",
    role: "What Missionism-compatible means",
  },
] as const;

export const deepSpecPointers = [
  "HUMAN_COMPACT.md",
  "CERTIFICATION.md",
  "ERA_ECONOMICS.md",
  "MCU_PROTOCOL.md",
  "FOUNDER_CLOCK.md",
  "DECISION_COMPILER.md",
] as const;

/**
 * Falsifiable predictions if Missionism works.
 * Proposed — not Canonical claims. Failure of these is evidence the mechanism
 * is not working, not a moral failure of the people trying it.
 */
export const experimentPredictions = {
  title: "What we should observe if this works",
  maturity: "proposed" as const,
  lead: "Missionism is not only a fairness story. It is a hypothesis about how to organize work so incentives reinforce the mission.",
  hypothesis:
    "Better structural alignment → less required control → more human autonomy at greater organizational complexity.",
  ifWorking: [
    "Less monitoring and managerial machinery needed to keep people pointed at the mission",
    "Better succession: people prepare replacements instead of hoarding indispensability",
    "More knowledge sharing and documentation",
    "Less incentive to cling to personal power at the expense of the institution",
    "Contributors behaving more like long-term owners of the mission",
    "The mission surviving individual departures",
  ],
  ifNot:
    "If those things do not happen, the mechanism is not working. Change the rules prospectively — or conclude this approach failed for that organization.",
  designConstraint:
    "Every rule Missionism adds should remove more coordination complexity than it creates.",
};
