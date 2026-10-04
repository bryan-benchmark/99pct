import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalClaim } from "@/components/CanonicalClaim";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import {
  federationNote,
  modelSteps,
  nestedTree,
  workedExample,
} from "@/content/howItWorks";
import { shortDefinition } from "@/content/voice";

export const metadata: Metadata = {
  title: "How It Works",
  description: shortDefinition,
};

export default function HowItWorksPage() {
  return (
    <Page
      title="How it works"
      lede={shortDefinition}
      source="spec/canonical.json"
    >
      <Section title="The model">
        <pre className="mono text-sm">
          {modelSteps
            .map((s) => `${s.label.toUpperCase()}\n${s.question}`)
            .join("\n\n")}
        </pre>
        <p className="mt-3 text-[var(--muted)]">
          Asking these questions is part of how Missionism organizations work.
          Exact formulas for measuring value, issuing ownership, or representing
          missions in a federation are mostly open or proposed.
        </p>
        <div className="mt-4 space-y-3">
          <CanonicalClaim id="measurableMission" />
          <CanonicalClaim id="contributorPath" />
        </div>
      </Section>

      <Section title="Missions can contain missions">
        <CanonicalClaim id="missionRecursion" />
        <div className="mt-3">
          <CanonicalClaim id="missionAutonomy" />
        </div>
        <p className="mt-3">
          Each node can have a mission, value equation, contributors, ownership,
          governance, child missions, a parent mission, and a fork path.
        </p>
        <pre className="mono text-sm">{nestedTree}</pre>
      </Section>

      <Section title="A worked example">
        <p>{workedExample.disclaimer}</p>
        <p className="mt-4">Five people start a company.</p>
        <p className="mt-4 font-medium text-[var(--ink)]">Year 0</p>
        <pre className="mono text-sm">
          {workedExample.year0
            .map(([name, pct]) => `${name.padEnd(20)}${pct}`)
            .join("\n")}
        </pre>
        <p className="mt-4">
          Five years later, 30 additional people have created substantial
          enduring value.
        </p>
        <p className="mt-4 font-medium text-[var(--ink)]">Year 5</p>
        <pre className="mono text-sm">
          {workedExample.year5
            .map(([name, pct]) => `${name.padEnd(20)}${pct}`)
            .join("\n")}
        </pre>
        {workedExample.punchline.map((line) => (
          <p key={line} className="mt-2">
            {line}
          </p>
        ))}
      </Section>

      <Section title="That company joins a larger mission">
        <CanonicalClaim id="missionAutonomy" />
        <p className="mt-3">It retains autonomy over:</p>
        <ul className="list-disc pl-5">
          {workedExample.federation.autonomy.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3">It participates upstream in:</p>
        <ul className="list-disc pl-5">
          {workedExample.federation.upstream.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section
        title="Federation representation"
        badge={<MaturityBadge level={federationNote.maturity} />}
      >
        <p>{federationNote.problem}</p>
        <pre className="mono text-sm">{federationNote.sketch}</pre>
        <p>{federationNote.status}</p>
        <p className="text-[var(--muted)]">
          Proposal: <code className="mono">{federationNote.proposalPath}</code>
          {" · "}
          <Link href="/open-questions">Open questions</Link>
        </p>
      </Section>
    </Page>
  );
}
