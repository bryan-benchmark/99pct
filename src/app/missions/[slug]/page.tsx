import { notFound } from "next/navigation";
import { getMissionDb } from "@/missions/db/runtime";
import { missionEmptyStates } from "@/missions/model";
import { getPublicMission } from "@/missions/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

function Rail({ title, body }: { title: string; body: string }) {
  return (
    <section className="border-t border-[var(--line)] pt-5">
      <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
      <p className="mt-2 text-[var(--muted)]">{body}</p>
    </section>
  );
}

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let mission: Awaited<ReturnType<typeof getPublicMission>>;
  try {
    mission = await getPublicMission(await getMissionDb(), slug);
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!mission) notFound();
  const created = new Date(mission.createdAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Forming</p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{mission.name}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{mission.purpose}</p>
      <dl className="mt-8 space-y-3 text-[var(--body)]">
        <div><dt className="font-semibold text-[var(--ink)]">Who this is for</dt><dd>{mission.beneficiaries}</dd></div>
        <div><dt className="font-semibold text-[var(--ink)]">Where it starts</dt><dd>{mission.startingPlace}</dd></div>
        <div><dt className="font-semibold text-[var(--ink)]">Started</dt><dd>{created}</dd></div>
      </dl>
      <div className="mt-10 space-y-5">
        <Rail title="Projects & work" body={missionEmptyStates.projects} />
        <Rail title="Contribution" body={missionEmptyStates.contribution} />
        <Rail title="Ownership" body={missionEmptyStates.ownership} />
        <Rail title="Governance" body={missionEmptyStates.governance} />
      </div>
    </article>
  );
}
