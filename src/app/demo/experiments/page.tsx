import type { Metadata } from "next";
import Link from "next/link";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import { ExperimentForm } from "./ExperimentForm";

export const metadata: Metadata = { title: "Experiment registry demo" };

export default function ExperimentsPage() {
  return <Page title="Propose an experiment" lede="Record what should change, what to measure, and when to stop." source="docs/proposals/EXPERIMENT_REGISTRY_DEMO.md" sourceKind="proposal">
    <Section title="Toolshare example" badge={<MaturityBadge level="experimental" />}>
      <p>This local registry creates a reviewable proposal only. It does not enroll participants, randomize anyone, change a live service, collect outcome data, or promote a protocol rule.</p>
      <p><Link href="/demo/toolshare">Explore Toolshare</Link></p>
    </Section>
    <Section title="Pre-register a test"><ExperimentForm /></Section>
  </Page>;
}
