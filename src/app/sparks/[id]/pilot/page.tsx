import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page, Section } from "@/components/Page";
import { MaturityBadge } from "@/components/MaturityBadge";
import { getSpark } from "@/sparks/store";
import { PilotForm } from "./PilotForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prepare a pilot" };

export default async function PreparePilotPage({ params }: PageProps<"/sparks/[id]/pilot">) {
  const { id } = await params;
  const spark = await getSpark(id);
  if (!spark) notFound();

  return (
    <Page
      title={`Prepare a pilot for ${spark.name}`}
      lede="Turn a broad idea into one bounded test. Saving this plan makes it a candidate for human review; it does not start a pilot."
      source="docs/proposals/MISSION_NETWORK_V0.md"
      sourceKind="proposal"
    >
      <Section title="Pilot gate" badge={<MaturityBadge level="experimental" />}>
        <p>
          The Spark proposes: <strong>{spark.pilot}</strong> The original
          success evidence is: <strong>{spark.evidence}</strong> You can narrow
          either one below. A big Vision may need many small pilots.
        </p>
        <p>
          Anyone with this link can draft a candidate plan. The proposed steward
          and resources are unverified. No reviewer is connected yet, and no
          funds, permissions, or work are committed here.
        </p>
        <PilotForm sparkId={id} pilot={spark.pilot} evidence={spark.evidence} />
      </Section>
    </Page>
  );
}
