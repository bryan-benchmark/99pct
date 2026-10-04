import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { LaunchPrototype } from "./LaunchPrototype";

export const metadata: Metadata = { title: "Mishys Launch" };

export default function MishysLaunchPage() {
  return (
    <Page
      title="Mishys Launch"
      lede="Organizational interview, not an incorporation form. You answer ordinary questions. Mishys compiles the mission, company bridge, people, rules, and mocked legal package."
      source="docs/proposals/MISHYS_LAUNCH.md"
      sourceKind="proposal"
    >
      <Section title="Status" badge={<MaturityBadge level="experimental" />}>
        <p>
          Architecture freeze holds. This pass fixes the UX model: Missionism
          compiler upstream of the legal adapter. Product laws:{" "}
          <code className="mono">MU ≠ legal share</code> · founder chooses
          intentions (including mission) · Mishys chooses implementation —
          including <code className="mono">Increase X / Decrease X</code>.
        </p>
        <p className="text-[var(--muted)]">
          Still mocked — no Firebase, no filing API, no securities logic. Pass
          condition: “I entered what I care about, and a correct company came
          out.” Not: “I know how to write a Missionism mission.”
        </p>
        <p>
          Spec: <code className="mono">docs/proposals/MISHYS_LAUNCH.md</code>
          {" · "}
          <Link href="/simulators/mission-units">MU simulator</Link>
        </p>
        <p>
          Starting with an idea? Try the{" "}
          <Link href="/simulators/mission-spark">Spark prototype</Link> first.
        </p>
      </Section>

      <Section title="Start a Missionism company">
        <LaunchPrototype />
      </Section>
    </Page>
  );
}
