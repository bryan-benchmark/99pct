import type { Metadata } from "next";
import { Page, Section } from "@/components/Page";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Workspace sign-in" };

export default async function WorkspaceSignInPage({ searchParams }: PageProps<"/workspace/sign-in">) {
  const query = await searchParams;
  const nextPath = typeof query.next === "string" && /^\/workspace\/invites\/[a-f0-9]{64}$/.test(query.next) ? query.next : "/workspace";
  return <Page title="Mission Workspace" lede="Sign in to your organization's private workspace." source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <meta name="referrer" content="no-referrer" />
    <Section title="Your account"><SignInForm nextPath={nextPath} /></Section>
  </Page>;
}
