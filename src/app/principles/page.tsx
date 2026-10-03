import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalClaim } from "@/components/CanonicalClaim";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import {
  alignmentCompression,
  mechanismExample,
  nonDecisions,
  principleEntries,
} from "@/content/principles";
import {
  humanConstraintCodes,
  humanConstraintIds,
} from "@/protocol/canonical";

export const metadata: Metadata = { title: "Principles" };

const humanConstraintTitles: Record<string, string> = {
  equalStanding: "Equal human standing",
  freedomOfConscience: "Freedom of conscience",
  nonCoercion: "Nonviolence and non-coercion",
  humanDignity: "Ideas challengeable; people retain dignity",
  reciprocity: "Reciprocity",
};

export default function PrinciplesPage() {
  const core = principleEntries.filter((p) => p.kind === "principle");
  const constraints = principleEntries.filter((p) => p.kind === "constraint");

  return (
    <Page
      title="Principles"
      lede="Durable rules. Mechanisms are not principles. Canonical wording comes only from canonical.json; the paragraphs below only explain."
      source="spec/canonical.json"
    >
      <Section title="Principles">
        <ol className="list-decimal space-y-8 pl-5">
          {core.map((item) => (
            <li key={item.claimId} className="pl-1">
              <strong className="text-[var(--ink)]">{item.title}</strong>
              <div className="mt-3">
                <CanonicalClaim id={item.claimId} />
              </div>
              <p className="mt-3 text-[var(--body)]">{item.explanation}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Organizational constraints">
        <p>
          Constraints bind implementations without freezing a single mechanism.
        </p>
        <ol className="mt-4 list-decimal space-y-8 pl-5">
          {constraints.map((item) => (
            <li key={item.claimId} className="pl-1">
              <strong className="text-[var(--ink)]">{item.title}</strong>
              <div className="mt-3">
                <CanonicalClaim id={item.claimId} />
              </div>
              <p className="mt-3 text-[var(--body)]">{item.explanation}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Human constraints">
        <CanonicalClaim id="humansNotVariables" />
        <p className="mt-3 text-[var(--body)]">
          Individually identified floor rules (HC-01…HC-05).{" "}
          <code className="mono">HUMAN_COMPACT.md</code> explains them; it does
          not originate them.
        </p>
        <ol className="mt-6 list-decimal space-y-8 pl-5">
          {humanConstraintIds.map((id) => (
            <li key={id} className="pl-1">
              <strong className="text-[var(--ink)]">
                {humanConstraintCodes[id]} · {humanConstraintTitles[id]}
              </strong>
              <div className="mt-3">
                <CanonicalClaim constraint={id} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Principles are not mechanisms">
        <p>
          Example of the intended layering. Only the claim text below is
          Canonical. The equity instrument is{" "}
          <MaturityBadge level="proposed" />.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Principle
            </p>
            <CanonicalClaim id={mechanismExample.claimIdPrinciple} />
          </div>
          <div>
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Constraint
            </p>
            <CanonicalClaim id={mechanismExample.claimIdConstraint} />
          </div>
          <div>
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Mechanism <MaturityBadge level="proposed" />
            </p>
            <p className="mt-2">{mechanismExample.mechanism}</p>
            <p className="mt-2 text-[var(--muted)]">
              Alternatives: {mechanismExample.alternatives.join(" · ")}
            </p>
          </div>
        </div>
      </Section>

      <Section
        title={alignmentCompression.title}
        badge={<MaturityBadge level={alignmentCompression.maturity} />}
      >
        <p className="font-semibold text-[var(--ink)]">
          {alignmentCompression.thesis}
        </p>
        {alignmentCompression.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="font-semibold text-[var(--ink)]">
          {alignmentCompression.punch}
        </p>
        <p>
          Design test:{" "}
          <strong className="text-[var(--ink)]">
            {alignmentCompression.designTest}
          </strong>
        </p>
        <p className="text-[var(--muted)]">
          Not yet Canonical. Candidate for the core corpus after experiments
          show it holds. See <Link href="/why-now">Why now</Link> for the
          fuller argument.
        </p>
      </Section>

      <Section title="What Missionism does not decide">
        <CanonicalClaim id="voluntaryAdoption" />
        <ul className="mt-4 list-disc space-y-1 pl-5">
          {nonDecisions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
