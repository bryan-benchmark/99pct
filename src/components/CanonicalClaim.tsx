import {
  claim,
  humanConstraint,
  humanConstraintCodes,
  type ClaimId,
  type HumanConstraintId,
} from "@/protocol/canonical";

function CanonicalBadge() {
  return (
    <span className="maturity maturity-canonical" title="Canonical">
      Canonical
    </span>
  );
}

/**
 * Sole UI path for CANONICAL text. Do not render Canonical elsewhere.
 * Pass either `id` (claim) or `constraint` (human-floor HC-01…HC-05).
 *
 * `compact` — homepage/lede use: claim text without figure chrome.
 * Still the only allowed rendering path (no side entrance via claim()).
 */
export function CanonicalClaim({
  id,
  constraint,
  compact = false,
}: {
  id?: ClaimId;
  constraint?: HumanConstraintId;
  compact?: boolean;
}) {
  if (constraint && id) {
    throw new Error("CanonicalClaim: pass id or constraint, not both");
  }
  if (constraint) {
    const text = humanConstraint(constraint);
    const code = humanConstraintCodes[constraint];
    if (compact) {
      return (
        <p
          className="text-lg leading-relaxed text-[var(--body)]"
          data-canonical-claim={constraint}
        >
          <span className="sr-only">Canonical {code}. </span>
          {text}
        </p>
      );
    }
    return (
      <figure className="canonical-claim">
        <figcaption className="mb-2 flex flex-wrap items-baseline gap-2">
          <CanonicalBadge />
          <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--muted)]">
            {code}
          </span>
        </figcaption>
        <blockquote className="border-l-2 border-[var(--line)] pl-4 text-[var(--ink)]">
          {text}
        </blockquote>
      </figure>
    );
  }
  if (!id) {
    throw new Error("CanonicalClaim: pass id or constraint");
  }
  const text = claim(id);
  if (compact) {
    return (
      <p
        className="text-lg leading-relaxed text-[var(--body)]"
        data-canonical-claim={id}
      >
        <span className="sr-only">Canonical. </span>
        {text}
      </p>
    );
  }
  return (
    <figure className="canonical-claim">
      <figcaption className="mb-2">
        <CanonicalBadge />
      </figcaption>
      <blockquote className="border-l-2 border-[var(--line)] pl-4 text-[var(--ink)]">
        {text}
      </blockquote>
    </figure>
  );
}
