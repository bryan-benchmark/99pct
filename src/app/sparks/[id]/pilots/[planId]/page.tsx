import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { MaturityBadge } from "@/components/MaturityBadge";
import { getSpark } from "@/sparks/store";
import { getPilotPlan } from "@/pilots/store";
import { economicModes } from "@/pilots/types";
import { CopyLink } from "@/app/sparks/[id]/CopyLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Candidate pilot plan" };

export default async function PilotPlanPage({ params }: PageProps<"/sparks/[id]/pilots/[planId]">) {
  const { id, planId } = await params;
  const [spark, plan] = await Promise.all([getSpark(id), getPilotPlan(id, planId)]);
  if (!spark || !plan) notFound();

  return (
    <Page
      title={`Candidate pilot: ${spark.name}`}
      lede={plan.scope}
      source="docs/proposals/MISSION_NETWORK_V0.md"
      sourceKind="proposal"
    >
      <Section title="Ready for human review" badge={<MaturityBadge level="experimental" />}>
        <p>
          Every required planning field is present. The proposed steward,
          funding, consent, feasibility, and safeguards have not been verified.
          This plan has not been approved and no pilot has started.
        </p>
        <CopyLink label="Copy candidate plan link" />
        <p><Link href={`/sparks/${id}`}>View the original Spark</Link></p>
      </Section>
      <Section title="Bounded test">
        <dl className="space-y-3">
          <div><dt className="font-semibold">What happens</dt><dd>{plan.scope}</dd></div>
          <div><dt className="font-semibold">Proposed responsible role or team</dt><dd>{plan.steward}</dd></div>
          <div><dt className="font-semibold">End date</dt><dd>{plan.endDate}</dd></div>
        </dl>
      </Section>
      <Section title="Resources and economic mode">
        <dl className="space-y-3">
          <div><dt className="font-semibold">Mode</dt><dd>{economicModes[plan.economicMode]}</dd></div>
          <div><dt className="font-semibold">Possible funding source</dt><dd>{plan.fundingSource}</dd></div>
          <div><dt className="font-semibold">Resource limit</dt><dd>{plan.resourceLimit}</dd></div>
        </dl>
      </Section>
      <Section title="Success and protection">
        <dl className="space-y-3">
          <div><dt className="font-semibold">Success measure</dt><dd>{plan.successMeasure}</dd></div>
          <div><dt className="font-semibold">Human guardrail</dt><dd>{plan.humanGuardrail}</dd></div>
          <div><dt className="font-semibold">Safety and environment guardrail</dt><dd>{plan.safetyGuardrail}</dd></div>
          <div><dt className="font-semibold">Participant notice and choice</dt><dd>{plan.participantNotice}</dd></div>
          <div><dt className="font-semibold">Early stop rule</dt><dd>{plan.stopRule}</dd></div>
        </dl>
      </Section>
    </Page>
  );
}
