import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { verifyWorkspaceSession } from "@/workspace/auth/server";
import { sessionCookieName } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { getInvitationForRecipient } from "@/workspace/invitations";
import { WorkspaceError } from "@/workspace/organizations";
import { recordWorkspaceFailure } from "@/workspace/http-errors";
import { WorkspaceUnavailable } from "@/app/workspace/WorkspaceUnavailable";
import { AcceptInvitationButton } from "./AcceptInvitationButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspace invitation" };

export default async function InvitationPage({ params }: PageProps<"/workspace/invites/[token]">) {
  const { token } = await params;
  let actor;
  try { actor = await verifyWorkspaceSession((await cookies()).get(sessionCookieName)?.value); }
  catch (error) { return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.session.verify", error)} retryHref={`/workspace/invites/${token}`} />; }
  if (!actor) redirect(`/workspace/sign-in?next=${encodeURIComponent(`/workspace/invites/${token}`)}`);
  let invitation;
  try { invitation = await getInvitationForRecipient(await getWorkspaceDb(), token, actor); }
  catch (error) {
    if (error instanceof WorkspaceError && error.status === 404) notFound();
    return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.invitation.load", error)} retryHref={`/workspace/invites/${token}`} />;
  }
  return <Page title="Workspace invitation" lede={`Signed in as ${actor.email}`} source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <meta name="referrer" content="no-referrer" />
    <Section title={invitation.org_name}><p>You are invited as a {invitation.role}. Accept to join this organization.</p><AcceptInvitationButton token={token} /></Section>
  </Page>;
}
