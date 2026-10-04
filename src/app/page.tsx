import Link from "next/link";
import type { ReactNode } from "react";
import { DocStatus } from "@/components/DocStatus";
import {
  builtForGenerations,
  goDeeper,
  homeHero,
  threeIdeas,
  weComeInPeace,
  whatChanges,
  whatDoesntChange,
  whyThisMatters,
} from "@/content/home";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-[var(--ink)] md:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[var(--body)]">{children}</div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[2.5rem]">
        Missionism
      </h1>

      <p className="mt-8 text-2xl font-semibold leading-snug text-[var(--ink)] md:text-3xl">
        {homeHero.line1}
        <br />
        {homeHero.line2}
      </p>

      <p className="mt-6 text-lg leading-relaxed text-[var(--body)] md:text-xl">
        {homeHero.definition}
      </p>

      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">
        {homeHero.product}
      </p>

      <p className="mt-8 font-[family-name:var(--font-sans)]">
        <Link
          href={homeHero.primaryCta.href}
          className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
        >
          {homeHero.primaryCta.label}
        </Link>
        <span className="mx-3 text-[var(--muted)]">·</span>
        <Link
          href={homeHero.secondaryCta.href}
          className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
        >
          {homeHero.secondaryCta.label}
        </Link>
        <span className="mx-3 text-[var(--muted)]">·</span>
        <Link href={homeHero.explainerCta.href} className="text-[var(--muted)]">
          {homeHero.explainerCta.label}
        </Link>
      </p>

      <DocStatus source="spec/canonical.json" sourceKind="canonical" />

      <hr />

      <Section title={whyThisMatters.title}>
        <p className="text-lg font-semibold leading-snug text-[var(--ink)]">
          {whyThisMatters.lead}
        </p>
        {whyThisMatters.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Section>

      <Section title={threeIdeas.title}>
        <p className="font-[family-name:var(--font-sans)] text-sm font-semibold tracking-wide text-[var(--muted)]">
          {threeIdeas.triadTechnical}
        </p>
        {threeIdeas.items.map((item) => (
          <div
            key={item.label}
            className="space-y-2 border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0"
          >
            <h3 className="text-lg font-semibold text-[var(--ink)]">
              {item.label}
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {item.code}
            </p>
            <p>{item.body}</p>
          </div>
        ))}
      </Section>

      <Section title={whatChanges.title}>
        {whatChanges.pairs.map((pair) => (
          <div
            key={pair.today}
            className="space-y-2 border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0"
          >
            <p>
              <span className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Today
              </span>
            </p>
            <p className="text-[var(--muted)]">{pair.today}</p>
            <p>
              <span className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Missionism
              </span>
            </p>
            <p className="font-semibold text-[var(--ink)]">{pair.missionism}</p>
          </div>
        ))}
      </Section>

      <Section title={whatDoesntChange.title}>
        <p>{whatDoesntChange.still}</p>
        <p className="font-semibold text-[var(--ink)]">
          {whatDoesntChange.changes}
        </p>
      </Section>

      <Section title={builtForGenerations.title}>
        {builtForGenerations.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="font-semibold text-[var(--ink)]">
          {builtForGenerations.punch}
        </p>
      </Section>

      <Section title={weComeInPeace.title}>
        {weComeInPeace.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="font-semibold text-[var(--ink)]">{weComeInPeace.point}</p>
      </Section>

      <Section title={goDeeper.title}>
        <p className="font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[var(--body)]">
          {goDeeper.links.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : null}
              <Link href={link.href}>{link.label}</Link>
            </span>
          ))}
        </p>
      </Section>
    </div>
  );
}
