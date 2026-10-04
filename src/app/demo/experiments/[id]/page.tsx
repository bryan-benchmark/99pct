import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/app/sparks/[id]/CopyLink";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { getExperiment } from "@/experiments/store";
import { exposureClasses } from "@/experiments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Experiment proposal" };

export default async function ExperimentPage({ params }: PageProps<"/demo/experiments/[id]">) {
  const { id } = await params;
  const proposal = await getExperiment(id);
  if (!proposal) notFound();
  return <Page title="Experiment proposal" lede={proposal.hypothesis} source="docs/proposals/EXPERIMENT_REGISTRY_DEMO.md" sourceKind="proposal">
    <Section title="Proposed for review" badge={<MaturityBadge level="experimental" />}>
      <p>This is a saved design for the fictional Toolshare demo. No one has been enrolled or exposed, no outcomes have been measured, and no Mission or protocol default has changed.</p>
      <CopyLink label="Copy experiment proposal link" />
      <p><Link href="/demo/experiments">Draft another proposal</Link></p>
    </Section>
    <Section title="Design"><dl className="space-y-3">
      <div><dt className="font-semibold">Hypothesis</dt><dd>{proposal.hypothesis}</dd></div>
      <div><dt className="font-semibold">What changes</dt><dd>{proposal.intervention}</dd></div>
      <div><dt className="font-semibold">Comparison</dt><dd>{proposal.comparison}</dd></div>
      <div><dt className="font-semibold">Exposure class</dt><dd>{exposureClasses[proposal.exposureClass]}</dd></div>
      <div><dt className="font-semibold">Primary outcome</dt><dd>{proposal.primaryOutcome}</dd></div>
      <div><dt className="font-semibold">Evidence plan</dt><dd>{proposal.evidencePlan}</dd></div>
    </dl></Section>
    <Section title="Protection and decision"><dl className="space-y-3">
      <div><dt className="font-semibold">Human guardrail</dt><dd>{proposal.humanGuardrail}</dd></div>
      <div><dt className="font-semibold">Notice and consent</dt><dd>{proposal.consentPlan}</dd></div>
      <div><dt className="font-semibold">Early stop</dt><dd>{proposal.stopRule}</dd></div>
      <div><dt className="font-semibold">Review end date</dt><dd>{proposal.endDate}</dd></div>
      <div><dt className="font-semibold">Adoption decision</dt><dd>{proposal.adoptionRule}</dd></div>
    </dl></Section>
  </Page>;
}
