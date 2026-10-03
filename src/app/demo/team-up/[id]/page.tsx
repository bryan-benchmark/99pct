import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/app/sparks/[id]/CopyLink";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { getTeamUp } from "@/teamups/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Candidate Team-Up" };

export default async function TeamUpProposalPage({ params }: PageProps<"/demo/team-up/[id]">) {
  const { id } = await params;
  const proposal = await getTeamUp(id);
  if (!proposal) notFound();

  return (
    <Page title="Candidate Team-Up" lede={proposal.purpose} source="docs/proposals/TEAMUP_DEMO.md" sourceKind="proposal">
      <Section title="For human review" badge={<MaturityBadge level="experimental" />}>
        <p>Toolshare × Repair is a fictional example. This saved proposal has not been accepted by either Mission. It creates no legal agreement, service obligation, payment, or Mission Units.</p>
        <CopyLink label="Copy candidate Team-Up link" />
        <p><Link href="/demo/team-up">Draft another candidate</Link></p>
      </Section>
      <Section title="Work and contributions"><dl className="space-y-3">
        <div><dt className="font-semibold">Purpose</dt><dd>{proposal.purpose}</dd></div>
        <div><dt className="font-semibold">Toolshare contributes</dt><dd>{proposal.toolshareContribution}</dd></div>
        <div><dt className="font-semibold">Repair contributes</dt><dd>{proposal.repairContribution}</dd></div>
        <div><dt className="font-semibold">Deliverable</dt><dd>{proposal.deliverable}</dd></div>
      </dl></Section>
      <Section title="Authority and coordination"><dl className="space-y-3">
        <div><dt className="font-semibold">Toolshare decides</dt><dd>{proposal.toolshareAuthority}</dd></div>
        <div><dt className="font-semibold">Repair decides</dt><dd>{proposal.repairAuthority}</dd></div>
        <div><dt className="font-semibold">Both approve</dt><dd>{proposal.jointApproval}</dd></div>
        <div><dt className="font-semibold">Coordination</dt><dd>{proposal.coordinationPlan}</dd></div>
      </dl></Section>
      <Section title="Limits and exit"><dl className="space-y-3">
        <div><dt className="font-semibold">Success measure</dt><dd>{proposal.successMeasure}</dd></div>
        <div><dt className="font-semibold">Resource limit</dt><dd>{proposal.resourceLimit}</dd></div>
        <div><dt className="font-semibold">Settlement proposal</dt><dd>{proposal.settlementPlan}</dd></div>
        <div><dt className="font-semibold">End date</dt><dd>{proposal.endDate}</dd></div>
        <div><dt className="font-semibold">Early stop</dt><dd>{proposal.stopRule}</dd></div>
      </dl></Section>
    </Page>
  );
}
