import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { getToolshareSnapshot } from "@/toolshare/store";
import { ToolshareDemo } from "./ToolshareDemo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Toolshare demo" };

export default async function ToolsharePage() {
  const browserId = (await cookies()).get("toolshare_demo_browser")?.value;
  const snapshot = await getToolshareSnapshot(browserId);

  return (
    <Page
      title="Toolshare"
      lede="Make owning rarely used household tools unnecessary. This demo shows the first service flow: find a tool, reserve it, use it, return it, or flag a problem."
      source="docs/proposals/TOOLSHARE_DEMO.md"
      sourceKind="proposal"
    >
      <Section title="Local service demo" badge={<MaturityBadge level="experimental" />}>
        <p>
          These are fictional tools in a local prototype. There is no physical
          locker, pickup, payment, liability agreement, or active lending
          Mission. Actions here are useful for testing the interface and event
          rules; they are not evidence of real demand.
        </p>
      </Section>
      <Section title="Find a tool">
        <ToolshareDemo snapshot={snapshot} />
      </Section>
      <Section title="What the demo learns">
        <dl className="grid grid-cols-3 gap-3 font-[family-name:var(--font-sans)] text-sm">
          <div><dt>Reservation requests</dt><dd className="text-2xl font-semibold">{snapshot.metrics.requests}</dd></div>
          <div><dt>Completed loans</dt><dd className="text-2xl font-semibold">{snapshot.metrics.completedLoans}</dd></div>
          <div><dt>Issue reports</dt><dd className="text-2xl font-semibold">{snapshot.metrics.issues}</dd></div>
        </dl>
        <p>
          Each action writes a versioned, append-only Mission event stored
          locally. These counts are derived from demo events. Actual operating
          cost and real-world outcomes are not measured yet.
        </p>
        <p><Link href="/demo/experiments">Draft a proposal to test a Toolshare change</Link></p>
      </Section>
      <Section title="Work with another Mission">
        <p>Try a bounded Team-Up proposal between this fictional Toolshare Mission and a fictional Repair Mission. The proposal records responsibilities, authority, limits, and exit conditions for review.</p>
        <p><Link href="/demo/team-up">Draft a Team-Up</Link></p>
      </Section>
    </Page>
  );
}
