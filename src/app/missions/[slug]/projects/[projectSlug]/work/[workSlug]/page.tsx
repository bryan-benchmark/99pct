import Link from "next/link";
import { notFound } from "next/navigation";
import { getMissionDb } from "@/missions/db/runtime";
import { publicMissionUrl, publicProjectUrl, workCopy } from "@/missions/model";
import { getPublicMission } from "@/missions/store";
import { getPublicProject, getPublicWork } from "@/missions/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ workSlug: string }> }) {
  const { workSlug } = await params;
  return { title: workSlug };
}

function workKind(kind: "task" | "role") {
  return kind === "task" ? "Task" : "Role";
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string; projectSlug: string; workSlug: string }> }) {
  const { slug, projectSlug, workSlug } = await params;
  let work: Awaited<ReturnType<typeof getPublicWork>>;
  let missionName = slug;
  let projectTitle = projectSlug;
  try {
    const db = await getMissionDb();
    work = await getPublicWork(db, slug, projectSlug, workSlug);
    if (work) {
      missionName = (await getPublicMission(db, slug))?.name ?? slug;
      projectTitle = (await getPublicProject(db, slug, projectSlug))?.title ?? projectSlug;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!work) notFound();
  const created = new Date(work.createdAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <Link href={publicMissionUrl(slug)}>{missionName}</Link>
        <span> · </span>
        <Link href={publicProjectUrl(slug, projectSlug)}>{projectTitle}</Link>
        <span> · {workKind(work.kind)} · Open</span>
      </p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{work.title}</h1>
      <p className="mt-6 text-lg font-semibold text-[var(--ink)]">{workCopy.joinUnavailable}</p>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{work.description}</p>
      <dl className="mt-8 space-y-3 text-[var(--body)]">
        <div><dt className="font-semibold text-[var(--ink)]">Done when</dt><dd>{work.doneWhen}</dd></div>
        <div><dt className="font-semibold text-[var(--ink)]">Posted</dt><dd>{created}</dd></div>
      </dl>
      <p className="mt-8 text-[var(--muted)]">{workCopy.readBoundary}</p>
    </article>
  );
}
