import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { TeamUpForm } from "./TeamUpForm";

export const metadata: Metadata = { title: "Team-Up proposal demo" };

export default function TeamUpPage() {
  return (
    <Page title="Propose a Team-Up" lede="Give two Missions a bounded reason to work together." source="docs/proposals/TEAMUP_DEMO.md" sourceKind="proposal">
      <Section title="Candidate agreement" badge={<MaturityBadge level="experimental" />}>
        <p>This example pairs the fictional Toolshare and Repair demos. Saving this form creates a candidate for human review. Neither Mission has accepted it, and no contract, payment, or Mission Units are created.</p>
        <p><Link href="/demo/toolshare">Explore the Toolshare demo</Link></p>
      </Section>
      <Section title="Define the work">
        <TeamUpForm />
      </Section>
    </Page>
  );
}
