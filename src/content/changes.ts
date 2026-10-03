export type ChangeEntry = {
  version: string;
  date: string;
  items: string[];
};

export const changes: ChangeEntry[] = [
  {
    version: "0.1",
    date: "September 2026",
    items: [
      "Initial public specification surface and website.",
      "Introduced protocol maturity labels (Canonical / Proposed / Experimental / Open).",
      "Single-sourced normative short claims in spec/canonical.json (website imports via src/protocol/canonical.ts).",
      "Canonical UI may only render via CanonicalClaim; MaturityBadge is Proposed/Experimental/Open only.",
      "Human-floor invariants promoted to humanConstraints (HC-01…HC-05); HUMAN_COMPACT explains, does not originate.",
      "Clarified purpose (why) vs tripleAlignment (completeness test); organization replaces company in those claims.",
      "Archived pre-0.1 Constitution to docs/archive/CONSTITUTION_v1_DRAFT.md; public protocol version is 0.1.",
      "Separated principles and constraints from mechanisms.",
      "Added an illustrative worked ownership example.",
      "Archived prior public doctrine pages under docs/archive/.",
      "Homepage rebuilt around locked public definition: better way to organize work; Own / Steer / Serve the mission (Proposed communication layer).",
      "Mishys Launch architecture: company compiler; DE PBC adapter; MU≠security; Clerky/Carta/Gusto/Brex rails (Proposed).",
      "Mishys Launch: eight-screen mocked founder prototype at /simulators/mishys-launch (Experimental).",
      "Mishys Launch: organizational interview (TurboTax-style mission compile) upstream of legal adapter (Experimental).",
      "Why now essay: capability, AI, and alignment as compression (Proposed).",
      "Proposed design test: every Missionism mechanism must remove more coordination complexity than it adds.",
      "Specification: falsifiable predictions if Missionism structure is working.",
    ],
  },
];
