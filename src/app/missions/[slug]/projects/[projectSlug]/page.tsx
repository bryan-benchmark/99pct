import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { projectCopy, publicMissionUrl, publicWorkUrl } from "@/missions/model";
import { getPublicMission } from "@/missions/store";
import { getPublicProject, listPublicWork, viewerMayCreate } from "@/missions/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const { projectSlug } = await params;
  return { title: projectSlug };
}

function workKind(kind: "task" | "role") {
  return kind === "task" ? "Task" : "Role";
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const { slug, projectSlug } = await params;
  let project: Awaited<ReturnType<typeof getPublicProject>>;
  let missionName = slug;
  let work: Awaited<ReturnType<typeof listPublicWork>> = [];
  let canPost = false;
  try {
    const db = await getMissionDb();
    project = await getPublicProject(db, slug, projectSlug);
    if (project) {
      missionName = (await getPublicMission(db, slug))?.name ?? slug;
      work = await listPublicWork(db, slug, projectSlug);
      try {
        const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
        canPost = await viewerMayCreate(db, slug, identity?.uid);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!project) notFound();
  const created = new Date(project.createdAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <Link href={publicMissionUrl(slug)}>{missionName}</Link>
        <span> · Active</span>
      </p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{project.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{project.outcome}</p>
      <p className="mt-3 text-[var(--muted)]">Created {created}</p>
      <section className="mt-10 border-t border-[var(--line)] pt-5">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Open work</h2>
        {work.length === 0 ? <p className="mt-2 text-[var(--muted)]">{projectCopy.emptyWork}</p> : (
          <ul className="mt-4 space-y-4">
            {work.map((item) => (
              <li key={item.slug}>
                <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{workKind(item.kind)}</p>
                <Link href={publicWorkUrl(slug, projectSlug, item.slug)} className="font-semibold text-[var(--ink)]">{item.title}</Link>
                <p className="mt-1 text-[var(--body)]">{item.description}</p>
              </li>
            ))}
          </ul>
        )}
        {canPost ? <p className="mt-4"><Link href={`/missions/${slug}/projects/${projectSlug}/work/new`} className="font-semibold text-[var(--ink)]">Post needed Work</Link></p> : null}
      </section>
      <p className="mt-8 text-[var(--muted)]">{projectCopy.workBoundary}</p>
    </article>
  );
}
