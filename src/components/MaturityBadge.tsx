import {
  maturityLabels,
  type NonCanonicalMaturity,
} from "@/content/protocolMeta";

/**
 * Public maturity badge — Proposed / Experimental / Open only.
 * Canonical badges are rendered exclusively by CanonicalClaim.
 */
export function MaturityBadge({ level }: { level: NonCanonicalMaturity }) {
  return (
    <span className={`maturity maturity-${level}`} title={maturityLabels[level]}>
      {maturityLabels[level]}
    </span>
  );
}
