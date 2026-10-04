import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { getOwnInterest, listCreatorInterests, type CreatorInterest, type OwnInterest } from "@/missions/interest";
import { interestCountLabel, publicMissionUrl, publicProjectUrl, workCopy } from "@/missions/model";
import { getPublicMission } from "@/missions/store";
import { getPublicProject, getPublicWork, viewerMayCreate } from "@/missions/projects";
import { InterestForm } from "./InterestForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ workSlug: string }> }) {
  const { workSlug } = await params;
  return { title: workSlug };
}

function workKind(kind: "task" | "role") {
  return kind === "task" ? "Task" : "Role";
}

function expressedAt(value: string) {
  return new Date(value).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string; projectSlug: string; workSlug: string }> }) {
  const { slug, projectSlug, workSlug } = await params;
  let work: Awaited<ReturnType<typeof getPublicWork>>;
  let missionName = slug;
  let projectTitle = projectSlug;
  let creatorView = false;
  let interests: CreatorInterest[] = [];
  let ownInterest: OwnInterest | null = null;
  let signedIn = false;
  try {
    const db = await getMissionDb();
    work = await getPublicWork(db, slug, projectSlug, workSlug);
    if (work) {
      missionName = (await getPublicMission(db, slug))?.name ?? slug;
      projectTitle = (await getPublicProject(db, slug, projectSlug))?.title ?? projectSlug;
      try {
        const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
        signedIn = identity !== null;
        if (identity) {
          creatorView = await viewerMayCreate(db, slug, identity.uid);
          if (creatorView) interests = await listCreatorInterests(db, slug, projectSlug, workSlug, identity.uid);
          else ownInterest = await getOwnInterest(db, slug, projectSlug, workSlug, identity.uid);
        }
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!work) notFound();
  const created = expressedAt(work.createdAt);
  const returnPath = `/missions/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectSlug)}/work/${encodeURIComponent(workSlug)}`;
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <Link href={publicMissionUrl(slug)}>{missionName}</Link>
        <span> · </span>
        <Link href={publicProjectUrl(slug, projectSlug)}>{projectTitle}</Link>
        <span> · {workKind(work.kind)} · Open</span>
      </p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{work.title}</h1>
      {work.interestCount > 0 ? <p className="mt-3 text-[var(--muted)]">{interestCountLabel(work.interestCount)}</p> : null}
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{work.description}</p>
      <dl className="mt-8 space-y-3 text-[var(--body)]">
        <div><dt className="font-semibold text-[var(--ink)]">Done when</dt><dd>{work.doneWhen}</dd></div>
        <div><dt className="font-semibold text-[var(--ink)]">Posted</dt><dd>{created}</dd></div>
      </dl>
      <section className="mt-10 border-t border-[var(--line)] pt-5">
        {creatorView ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--ink)]">{workCopy.interestedPeople}</h2>
            {interests.length === 0 ? <p className="mt-2 text-[var(--muted)]">{workCopy.emptyInterests}</p> : (
              <ul className="mt-4 space-y-4">
                {interests.map((interest) => (
                  <li key={interest.email}>
                    <p className="font-semibold text-[var(--ink)]">{interest.email}</p>
                    {interest.note ? <p className="mt-1 text-[var(--body)]">{interest.note}</p> : null}
                    <p className="mt-1 text-[var(--muted)]">{expressedAt(interest.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : ownInterest ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--ink)]">{workCopy.interestSent}</h2>
            <p className="mt-2 text-[var(--body)]">{workCopy.interestSentDetail}</p>
            {ownInterest.note ? <p className="mt-3 text-[var(--body)]">{ownInterest.note}</p> : null}
          </>
        ) : signedIn ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--ink)]">{workCopy.wantToHelp}</h2>
            <InterestForm missionSlug={slug} projectSlug={projectSlug} workSlug={workSlug} />
          </>
        ) : (
          <p><Link href={`/sign-in?next=${encodeURIComponent(returnPath)}`} className="font-semibold text-[var(--ink)]">{workCopy.wantToHelp}</Link></p>
        )}
      </section>
      <p className="mt-8 text-[var(--muted)]">{workCopy.readBoundary}</p>
    </article>
  );
}
