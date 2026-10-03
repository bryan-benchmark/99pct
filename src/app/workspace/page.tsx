import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { verifyWorkspaceSession } from "@/workspace/auth/server";
import { sessionCookieName } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { listOrganizationsForMember } from "@/workspace/organizations";
import { SignOutButton } from "./SignOutButton";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { recordWorkspaceFailure } from "@/workspace/http-errors";
import { WorkspaceUnavailable } from "./WorkspaceUnavailable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mission Workspace" };

export default async function WorkspacePage() {
  let identity;
  try { identity = await verifyWorkspaceSession((await cookies()).get(sessionCookieName)?.value); }
  catch (error) { return <WorkspaceUnavailable requestId={recordWorkspaceFailure("page.session.verify", error)} />; }
  if (!identity) redirect("/workspace/sign-in");
  let organizations: Awaited<ReturnType<typeof listOrganizationsForMember>> | null = null;
  let failureId: string | null = null;
  try {
    organizations = await listOrganizationsForMember(await getWorkspaceDb(), identity.uid);
  } catch (error) {
    failureId = recordWorkspaceFailure("page.organizations.list", error);
  }
  return <Page title="Mission Workspace" lede={`Signed in as ${identity.email}`} source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <Section title="Your organizations">
      {organizations === null ? <p role="alert">Workspace data is temporarily unavailable. If this continues, give support reference <code>{failureId}</code>.</p> : organizations.length ? <ul>{organizations.map((organization) => <li key={organization.id}><Link href={`/workspace/organizations/${organization.id}`}>{organization.name}</Link> · {organization.role}</li>)}</ul> : <p>No organization workspace yet.</p>}
    </Section>
    {organizations !== null ? <Section title="Create an organization"><CreateOrganizationForm /></Section> : null}
    <Section title="Session"><SignOutButton /></Section>
  </Page>;
}
