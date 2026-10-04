import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { missionEmptyStates, publicProjectUrl } from "@/missions/model";
import { getPublicMission } from "@/missions/store";
import { listPublicProjects, viewerMayCreate } from "@/missions/projects";

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

function openWorkCount(count: number) {
  return count === 1 ? "1 open work item" : `${count} open work items`;
}

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let mission: Awaited<ReturnType<typeof getPublicMission>>;
  let projects: Awaited<ReturnType<typeof listPublicProjects>> = [];
  let canCreate = false;
  try {
    const db = await getMissionDb();
    mission = await getPublicMission(db, slug);
    if (mission) {
      projects = await listPublicProjects(db, slug);
      try {
        const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
        canCreate = await viewerMayCreate(db, slug, identity?.uid);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
      }
    }
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
        <section className="border-t border-[var(--line)] pt-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Projects & work</h2>
          {projects.length === 0 ? <p className="mt-2 text-[var(--muted)]">{missionEmptyStates.projects}</p> : (
            <ul className="mt-4 space-y-4">
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link href={publicProjectUrl(mission.slug, project.slug)} className="font-semibold text-[var(--ink)]">{project.title}</Link>
                  <p className="mt-1 text-[var(--body)]">{project.outcome}</p>
                  <p className="mt-1 text-[var(--muted)]">{openWorkCount(project.openWorkCount)}</p>
                </li>
              ))}
            </ul>
          )}
          {canCreate ? <p className="mt-4"><Link href={`/missions/${mission.slug}/projects/new`} className="font-semibold text-[var(--ink)]">Create a Project</Link></p> : null}
        </section>
        <Rail title="Contribution" body={missionEmptyStates.contribution} />
        <Rail title="Ownership" body={missionEmptyStates.ownership} />
        <Rail title="Governance" body={missionEmptyStates.governance} />
      </div>
    </article>
  );
}
