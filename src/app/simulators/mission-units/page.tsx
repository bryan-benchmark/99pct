import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { MissionUnitsSimulator } from "./Simulator";

export const metadata: Metadata = { title: "Mission Units Simulator" };

export default function MissionUnitsSimulatorPage() {
  return (
    <Page
      title="Mission Units simulator"
      lede="V0.2 persistence experiment: remember contribution forever without letting the past own the future forever."
      source="docs/proposals/MISSION_UNITS_V0.2.md"
      sourceKind="proposal"
    >
      <Section title="Status" badge={<MaturityBadge level="proposed" />}>
        <p>
          Design locks:{" "}
          <code className="mono">MISSION_UNITS_V0.1.md</code> ·{" "}
          <code className="mono">MISSION_UNITS_V0.2.md</code>. Invariants:{" "}
          <code className="mono">npm run test:mu</code>.
        </p>
        <p className="text-[var(--muted)]">
          MU immutable · EMU derived · optional dual current/legacy pools · real
          MU preferred · governance not simulated.{" "}
          <MaturityBadge level="experimental" />
        </p>
        <p>
          <Link href="/open-questions">Open questions</Link>
        </p>
      </Section>

      <Section title="Run">
        <MissionUnitsSimulator />
      </Section>
    </Page>
  );
}
