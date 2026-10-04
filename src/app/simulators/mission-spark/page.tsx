import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { SparkPrototype } from "./SparkPrototype";

export const metadata: Metadata = { title: "Mission Spark" };

export default function MissionSparkPage() {
  return (
    <Page
      title="What do you wish existed?"
      lede="Start with a need. Shape it into a small Mission proposal that people could test together."
      source="docs/proposals/MISSION_NETWORK_V0.md"
      sourceKind="proposal"
    >
      <Section title="Spark" badge={<MaturityBadge level="experimental" />}>
        <p>
          This is a local product prototype. You can save your draft to get a
          link in this installation, then collect nonbinding expressions of
          interest. It creates no company or ownership right.
        </p>
        <SparkPrototype />
      </Section>
      <Section title="What happens later?">
        <p>
          After you save, the proposal page lets people express interest and
          offer help. A promising proposal could then run a small pilot. If it works,
          the group can consider a formal Mission through{" "}
          <Link href="/simulators/mishys-launch">Mishys Launch</Link>.
        </p>
      </Section>
    </Page>
  );
}
