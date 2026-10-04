import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { whyNowMeta, whyNowSections } from "@/content/whyNow";

export const metadata: Metadata = {
  title: "Why now",
  description: whyNowMeta.lede,
};

export default function WhyNowPage() {
  return (
    <Page
      title={whyNowMeta.title}
      lede={whyNowMeta.lede}
      source={whyNowMeta.source}
      sourceKind={whyNowMeta.sourceKind}
    >
      <Section title="Status" badge={<MaturityBadge level="proposed" />}>
        <p>
          This essay is deeper context under Missionism — not the starting
          definition, and not Canonical. You do not need to accept every metaphor
          here to understand or try the ownership mechanisms. The homepage stays
          the short explanation; this page is Why now.
        </p>
        <p className="text-[var(--muted)]">
          Related: <Link href="/principles">Principles</Link>
          {" · "}
          <Link href="/specification">Specification</Link>
          {" · "}
          <Link href="/open-questions">Open questions</Link>
        </p>
      </Section>

      {whyNowSections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {"examples" in section && section.examples
            ? section.examples.map(([domain, a, b]) => (
                <p key={domain}>
                  <strong className="text-[var(--ink)]">{domain}:</strong>{" "}
                  <code className="mono">{a}</code> is not necessarily{" "}
                  <code className="mono">{b}</code>.
                </p>
              ))
            : null}
          {"close" in section && section.close ? (
            <p>{section.close}</p>
          ) : null}
          {"note" in section && section.note ? (
            <p className="text-[var(--muted)]">{section.note}</p>
          ) : null}
          {"punch" in section && section.punch ? (
            <p className="text-lg font-semibold leading-snug text-[var(--ink)]">
              {section.punch}
            </p>
          ) : null}
          {"claim" in section && section.claim ? (
            <p className="font-semibold text-[var(--ink)]">{section.claim}</p>
          ) : null}
          {"breakthrough" in section && section.breakthrough ? (
            <blockquote className="border-l-2 border-[var(--line)] pl-4 text-[var(--ink)]">
              {section.breakthrough}
            </blockquote>
          ) : null}
          {"boxed" in section && section.boxed ? (
            <p className="font-semibold text-[var(--ink)]">{section.boxed}</p>
          ) : null}
          {"constraint" in section && section.constraint ? (
            <p>
              Hard design constraint:{" "}
              <strong className="text-[var(--ink)]">{section.constraint}</strong>
            </p>
          ) : null}
        </Section>
      ))}

      <Section title="What to do with this">
        <p>
          You do not need to believe civilization is a wobbling tower. You need
          one testable proposition worth experimenting on:
        </p>
        <p className="font-semibold text-[var(--ink)]">
          Better alignment should let organizations handle more capability
          without proportionally more supervision.
        </p>
        <p>
          If you are asking why to mess with a cap table, the answer is not only
          fairness. It is that organizations are about to become considerably
          more powerful, and our existing solution to misalignment—management—
          is expensive, slow, and increasingly inadequate. Missionism proposes a
          structural alternative worth testing.
        </p>
        <p>
          <Link href="/how-it-works">How it works</Link>
          {" · "}
          <Link href="/specification">Specification</Link>
          {" · "}
          <Link href="/simulators/mission-units">Mission Units simulator</Link>
          {" · "}
          <Link href="/simulators/mishys-launch">Mishys Launch</Link>
        </p>
      </Section>
    </Page>
  );
}
