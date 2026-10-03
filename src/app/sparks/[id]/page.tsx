import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { getInterest, getInterestCounts, getSpark } from "@/sparks/store";
import { inputLabels, inputOptions, needLabels } from "@/sparks/types";
import { CopyLink } from "./CopyLink";
import { InterestForm } from "./InterestForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Spark proposal" };

export default async function SparkPage({ params }: PageProps<"/sparks/[id]">) {
  const { id } = await params;
  const spark = await getSpark(id);
  if (!spark) notFound();
  const totals = await getInterestCounts(id);
  const browserId = (await cookies()).get("mission_spark_browser")?.value;
  const mine = browserId ? await getInterest(id, browserId) : null;

  return (
    <Page
      title={spark.name}
      lede={spark.wish}
      source="docs/proposals/MISSION_NETWORK_V0.md"
      sourceKind="proposal"
    >
      <Section title="Spark proposal" badge={<MaturityBadge level="experimental" />}>
        <p>This is an idea to test. It is not yet a pilot or a certified Mission.</p>
        <dl className="space-y-3">
          <div><dt className="font-semibold">For</dt><dd>{spark.people}</dd></div>
          <div><dt className="font-semibold">Where</dt><dd>{spark.place}</dd></div>
          <div><dt className="font-semibold">First pilot</dt><dd>{spark.pilot}</dd></div>
          <div><dt className="font-semibold">Evidence it works</dt><dd>{spark.evidence}</dd></div>
          <div><dt className="font-semibold">Help needed</dt><dd>{spark.inputs.length ? spark.inputs.map((item) => needLabels[item]).join(" · ") : "Still to decide"}</dd></div>
        </dl>
        <CopyLink />
      </Section>
      <Section title="Express interest">
        <p>
          Choose what you might contribute. This is nonbinding: no money is
          collected, no work is promised, and no ownership or Mission Units are
          issued. No name or contact details are collected.
        </p>
        <InterestForm id={id} recorded={Boolean(mine)} />
      </Section>
      <Section title="Unverified interest">
        <p>
          {totals?.responses ?? 0} browser {totals?.responses === 1 ? "response" : "responses"} recorded.
          Each browser is counted once for this proposal. People can clear
          cookies or use another browser, so these numbers are not unique people,
          validated demand, or funding commitments.
        </p>
        <ul className="space-y-1">
          {inputOptions.map((input) => (
            <li key={input}>{inputLabels[input]}: {totals?.counts[input] ?? 0}</li>
          ))}
        </ul>
        <p className="text-sm text-[var(--muted)]">
          This link works in this local installation while its server and data
          directory are available. Public sharing will need hosted storage.
        </p>
      </Section>
      <Section title="Prepare a pilot">
        <p>
          A broad idea needs one bounded test before it becomes a Mission.
          Draft an operating plan, economic mode, success measure, guardrails,
          and stop rule for human review.
        </p>
        <p><Link href={`/sparks/${id}/pilot`}>Prepare a candidate pilot plan</Link></p>
      </Section>
    </Page>
  );
}
