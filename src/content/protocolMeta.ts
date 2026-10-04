import { protocol } from "@/protocol/canonical";

/** Re-export protocol version for DocStatus / footer — single source. */
export const protocolMeta = {
  version: protocol.version,
  status: protocol.status as "Draft",
  lastUpdated: protocol.lastUpdated,
  name: protocol.name,
} as const;

/** Only these may be rendered by the public MaturityBadge. */
export type NonCanonicalMaturity = "proposed" | "experimental" | "open";

export type Maturity = "canonical" | NonCanonicalMaturity;

export const maturityLabels: Record<Maturity, string> = {
  canonical: "Canonical",
  proposed: "Proposed",
  experimental: "Experimental",
  open: "Open",
};

export const maturityDefinitions: Record<Maturity, string> = {
  canonical:
    "Required to call an implementation Missionism-compatible.",
  proposed:
    "Preferred direction, but not yet part of the canonical protocol.",
  experimental:
    "Something we actively want implementations to test.",
  open: "Problem identified; no preferred solution yet.",
};
