import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { verifyWorkspaceSession } from "@/workspace/auth/server";
import { sessionCookieName } from "@/workspace/auth/session";
import { decisionQuestions, getDecisionRecord, type DecisionContent, type DecisionLenses } from "@/workspace/decisions";
import { contractQuestions, getContractRevision, type ContractAnswers } from "@/workspace/contracts";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { listOrganizationMembers } from "@/workspace/invitations";
import { getOrganizationForMember, WorkspaceError } from "@/workspace/organizations";
import { reviewGateQuestions, type ReviewGateKey } from "@/workspace/review-gates";
import { recordWorkspaceFailure } from "@/workspace/http-errors";
import { WorkspaceUnavailable } from "@/app/workspace/WorkspaceUnavailable";
import { DecisionForm } from "@/app/workspace/DecisionForm";
import { ReviewForm } from "./ReviewForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Operating decision" };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function DecisionContentView({ content }: { content: DecisionContent }) {
  return <>
    <p className="whitespace-pre-wrap font-semibold">{content.action || "Action not yet described."}</p>
    <dl className="mt-4 space-y-3">{(Object.entries(decisionQuestions) as [keyof DecisionLenses, string][]).map(([key, question]) => <div key={key}><dt className="font-semibold">{question}</dt><dd className="whitespace-pre-wrap">{content.lenses[key] || "Not yet answered."}</dd></div>)}</dl>
    {content.evidenceReferences.length ? <div className="mt-4"><h3 className="font-semibold">Evidence references</h3><ul>{content.evidenceReferences.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="underline">{url}</a></li>)}</ul></div> : null}
  </>;
}

export default async function DecisionPage({ params }: PageProps<"/workspace/organizations/[id]/decisions/[decisionId]">) {
  let actor;
  try { actor = await verifyWorkspaceSession((await cookies()).get(sessionCookieName)?.value); }
  catch (error) { return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.session.verify", error)} />; }
  if (!actor) redirect("/workspace/sign-in");
  const { id, decisionId } = await params;
  if (!idPattern.test(id) || !idPattern.test(decisionId)) notFound();
  let data;
  try {
    const db = await getWorkspaceDb();
    const organization = await getOrganizationForMember(db, id, actor.uid);
    if (organization) {
      const record = await getDecisionRecord(db, id, decisionId, actor.uid);
      const contract = await getContractRevision(db, id, actor.uid, record.contract_revision);
      if (!contract || contract.status !== "submitted") throw new Error("Bound Mission Contract revision is unavailable.");
      data = { organization, record, contract, members: await listOrganizationMembers(db, id, actor.uid) };
    } else data = null;
  } catch (error) {
    if (error instanceof WorkspaceError && error.status === 404) notFound();
    return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.decision.load", error)} retryHref={`/workspace/organizations/${id}/decisions/${decisionId}`} />;
  }
  if (!data) notFound();
  const { organization, record, contract, members } = data;
  const emailFor = (uid: string) => members.find((item) => item.user_id === uid)?.email || uid;
  const latest = record.revisions[0];
  const latestReview = record.reviews.find((item) => item.revision === latest?.revision);
  const canPropose = organization.role === "owner" || organization.role === "editor";
  const canReview = latest?.status === "submitted" && !latestReview && (organization.role === "owner" || organization.role === "reviewer") && latest.author_id !== actor.uid;
  return <Page title={latest?.content.title || "Operating decision"} lede={`Organization: ${organization.name} · Mission Contract revision ${record.contract_revision}`} source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <Section title="Current status"><p>Revision {latest?.revision} · {latest?.status}{latestReview ? ` · ${latestReview.disposition}` : ""}{latestReview && !latestReview.gates ? " · legacy review without hard-gate assessment" : ""}</p><p>Proposed by {emailFor(latest?.author_id || record.created_by)}. Human review is required; this record does not certify a Mission or change the protocol.</p></Section>
    <Section title={`Mission Contract revision ${contract.revision}`}><p>This submitted contract was selected when the decision was created. Later contract edits do not change this record.</p><dl className="mt-4 space-y-3">{(Object.entries(contractQuestions) as [keyof ContractAnswers, string][]).map(([key, question]) => <div key={key}><dt className="font-semibold">{question}</dt><dd className="whitespace-pre-wrap">{contract.answers[key]}</dd></div>)}</dl></Section>
    {latest ? <Section title="Decision record"><DecisionContentView content={latest.content} /></Section> : null}
    {canReview ? <Section title="Independent review"><ReviewForm orgId={id} decisionId={decisionId} revision={latest.revision} /></Section> : null}
    {latestReview ? <Section title="Review outcome"><p>{latestReview.disposition} by {emailFor(latestReview.reviewer_id)} on {new Date(latestReview.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC.</p><p className="whitespace-pre-wrap">{latestReview.reason}</p>{latestReview.gates ? <div className="mt-4"><h3 className="font-semibold">Human hard-gate assessment</h3><dl className="mt-2 space-y-2">{(Object.entries(reviewGateQuestions) as [ReviewGateKey, string][]).map(([key, question]) => <div key={key}><dt className="font-semibold">{question}</dt><dd>{latestReview.gates?.[key]?.status === "clear" ? "No blocker identified" : latestReview.gates?.[key]?.status === "triggered" ? "Blocker identified" : "Unresolved"}{latestReview.gates?.[key]?.note ? ` · ${latestReview.gates[key].note}` : ""}</dd></div>)}</dl><p className="mt-3">These are the reviewer’s recorded assessments, not a legal or protocol certification.</p></div> : <p className="mt-3">This review predates hard-gate assessment. Create a new decision revision for a gate-assessed review.</p>}</Section> : null}
    {canPropose && latest ? <Section title="New revision"><details><summary>Edit and create a new revision</summary><DecisionForm key={latest.revision} orgId={id} contractRevision={record.contract_revision} decisionId={decisionId} expectedRevision={latest.revision} initial={latest.content} /></details></Section> : null}
    <Section title="Revision history"><ol className="space-y-3">{record.revisions.map((item) => {
      const review = record.reviews.find((candidate) => candidate.revision === item.revision);
      return <li key={item.revision}><details><summary>Revision {item.revision} · {item.status} · {emailFor(item.author_id)} · {new Date(item.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC{review ? ` · ${review.disposition}` : ""}</summary><div className="mt-3"><DecisionContentView content={item.content} />{review ? <div className="mt-4"><h3 className="font-semibold">Review by {emailFor(review.reviewer_id)}</h3><p className="whitespace-pre-wrap">{review.disposition}: {review.reason}</p>{review.gates ? <dl className="mt-2 space-y-2">{(Object.entries(reviewGateQuestions) as [ReviewGateKey, string][]).map(([key, question]) => <div key={key}><dt className="font-semibold">{question}</dt><dd>{review.gates?.[key]?.status}{review.gates?.[key]?.note ? ` · ${review.gates[key].note}` : ""}</dd></div>)}</dl> : <p>Legacy review without hard-gate assessment.</p>}</div> : null}</div></details></li>;
    })}</ol></Section>
    <Section title="Navigation"><p><Link href={`/workspace/organizations/${id}`}>Back to organization</Link></p></Section>
  </Page>;
}
