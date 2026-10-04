import Link from "next/link";
import { Page, Section } from "@/components/Page";

export function WorkspaceUnavailable({ requestId, retryHref = "/workspace" }: { requestId: string; retryHref?: string }) {
  return <Page title="Workspace temporarily unavailable" lede="Your request could not be completed. Please try again shortly." source="docs/proposals/B2B_V1_EXECUTION.md" sourceKind="proposal">
    <meta name="referrer" content="no-referrer" />
    <Section title="Support reference"><p role="alert">If this continues, give support reference <code>{requestId}</code>.</p><p className="mt-3"><Link href={retryHref}>Try again</Link></p></Section>
  </Page>;
}
