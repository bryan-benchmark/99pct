import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { verifyWorkspaceSession } from "@/workspace/auth/server";
import { sessionCookieName } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { getOrganizationForMember, WorkspaceError } from "@/workspace/organizations";
import { recordWorkspaceFailure } from "@/workspace/http-errors";
import { WorkspaceUnavailable } from "@/app/workspace/WorkspaceUnavailable";
import { contractQuestions, getContractRevisions, type ContractAnswers } from "@/workspace/contracts";
import { ContractForm } from "./ContractForm";
import { listOrganizationMembers, listPendingInvitations } from "@/workspace/invitations";
import { AccessPanel } from "./AccessPanel";
import { listDecisions } from "@/workspace/decisions";
import { DecisionForm } from "@/app/workspace/DecisionForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Organization workspace" };

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function OrganizationPage({ params }: PageProps<"/workspace/organizations/[id]">) {
  let identity;
  try { identity = await verifyWorkspaceSession((await cookies()).get(sessionCookieName)?.value); }
  catch (error) { return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.session.verify", error)} />; }
  if (!identity) redirect("/workspace/sign-in");
  const { id } = await params;
  if (!idPattern.test(id)) notFound();
  let data;
  try {
    const db = await getWorkspaceDb();
    const organization = await getOrganizationForMember(db, id, identity.uid);
    data = organization ? {
      organization,
      revisions: await getContractRevisions(db, id, identity.uid),
      members: await listOrganizationMembers(db, id, identity.uid),
      pendingInvitations: organization.role === "owner" ? await listPendingInvitations(db, id, identity.uid) : [],
      decisions: await listDecisions(db, id, identity.uid),
    } : null;
  } catch (error) {
    if (error instanceof WorkspaceError && error.status === 404) notFound();
    return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.organization.load", error)} retryHref={`/workspace/organizations/${id}`} />;
  }
  if (!data) notFound();
  const { organization, revisions, members, pendingInvitations, decisions } = data;
  const submittedContract = revisions.find((item) => item.status === "submitted");
  const latest = revisions[0];
  return <Page title={organization.name} lede={`Your role: ${organization.role}`} source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <Section title="Mission Contract">
      {organization.role === "owner" ? <ContractForm key={latest?.revision || 0} orgId={id} revision={latest?.revision || 0} answers={latest?.answers} /> : <p>Only an owner can edit the Mission Contract.</p>}
      {latest ? <p className="mt-4">Latest revision: {latest.revision} · {latest.status}</p> : <p>No Mission Contract revision yet.</p>}
    </Section>
    {revisions.length ? <Section title="Revision history"><ol className="space-y-5">{revisions.map((item) => <li key={item.revision}><details><summary>Revision {item.revision} · {item.status} · {new Date(item.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC</summary><dl className="mt-3 space-y-3">{(Object.entries(contractQuestions) as [keyof ContractAnswers, string][]).map(([key, question]) => <div key={key}><dt className="font-semibold">{question}</dt><dd className="whitespace-pre-wrap">{item.answers[key]}</dd></div>)}</dl></details></li>)}</ol></Section> : null}
    <Section title="Operating decisions">{decisions.length ? <ul>{decisions.map((decision) => <li key={decision.id}><Link href={`/workspace/organizations/${id}/decisions/${decision.id}`}>{decision.title}</Link> · revision {decision.latest_revision} · {decision.status}{decision.disposition ? ` · ${decision.disposition}` : ""}</li>)}</ul> : <p>No operating decisions yet.</p>}{submittedContract && (organization.role === "owner" || organization.role === "editor") ? <details className="mt-4"><summary>Propose an operating decision</summary><DecisionForm orgId={id} contractRevision={submittedContract.revision} /></details> : !submittedContract ? <p>Submit the Mission Contract before proposing a decision.</p> : null}</Section>
    <Section title="Access"><AccessPanel orgId={id} actorId={identity.uid} members={members} invitations={pendingInvitations} owner={organization.role === "owner"} /></Section>
    <Section title="Audit"><p><Link href={`/workspace/organizations/${id}/audit`}>View chronological audit history and export records</Link></p></Section>
    <Section title="Navigation"><p><Link href="/workspace">Back to your organizations</Link></p></Section>
  </Page>;
}
