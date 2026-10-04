import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { listAuditEvents } from "@/workspace/audit";
import { verifyWorkspaceSession } from "@/workspace/auth/server";
import { sessionCookieName } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { getOrganizationForMember, WorkspaceError } from "@/workspace/organizations";
import { recordWorkspaceFailure } from "@/workspace/http-errors";
import { WorkspaceUnavailable } from "@/app/workspace/WorkspaceUnavailable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspace audit history" };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AuditPage({ params }: PageProps<"/workspace/organizations/[id]/audit">) {
  let actor;
  try { actor = await verifyWorkspaceSession((await cookies()).get(sessionCookieName)?.value); }
  catch (error) { return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.session.verify", error)} />; }
  if (!actor) redirect("/workspace/sign-in");
  const { id } = await params;
  if (!idPattern.test(id)) notFound();
  let data;
  try {
    const db = await getWorkspaceDb();
    const organization = await getOrganizationForMember(db, id, actor.uid);
    data = organization ? { organization, events: await listAuditEvents(db, id, actor.uid) } : null;
  } catch (error) {
    if (error instanceof WorkspaceError && error.status === 404) notFound();
    return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.audit.load", error)} retryHref={`/workspace/organizations/${id}/audit`} />;
  }
  if (!data) notFound();
  const { organization, events } = data;
  return <Page title="Audit history" lede={`${organization.name} · ${events.length} recorded events`} source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <Section title="Export"><p><a href={`/api/workspace/organizations/${id}/export`} className="underline">Download versioned JSON export</a>. It contains customer workspace records and a SHA-256 checksum for detecting accidental changes after download. The checksum is not a digital signature.</p></Section>
    <Section title="Recorded event order"><p>New events receive a durable sequence within this organization. Older events were ordered from their stored timestamps during migration and are marked below.</p><ol className="mt-4 space-y-5">{events.map((event) => <li key={event.id} className="border-b border-[var(--line)] pb-4"><p><strong>#{event.org_seq} · {event.action}</strong> · {new Date(event.occurred_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC{event.sequence_backfilled ? " · historical order estimated" : ""}</p><p>Actor: {event.actor_email} · {event.object_type} {event.object_id}{event.revision ? ` · revision ${event.revision}` : ""}</p><details><summary>Event data and ID</summary><p>Event ID: <code>{event.id}</code> · schema version {event.schema_version}</p><pre className="overflow-x-auto whitespace-pre-wrap text-sm">{JSON.stringify(event.payload, null, 2)}</pre></details></li>)}</ol></Section>
    <Section title="Navigation"><p><Link href={`/workspace/organizations/${id}`}>Back to organization</Link></p></Section>
  </Page>;
}
