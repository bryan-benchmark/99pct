import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GrowthBanner } from "@/components/GrowthBanner";
import { helpKinds, utilityByName, utilitySlug } from "@/content/utilities";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { missionEmptyStates, publicWorkUrl, type PublicWork } from "@/missions/model";
import { listCreatorOffers, type CreatorOffer } from "@/missions/offers";
import { getPublicMission } from "@/missions/store";
import { listPublicProjects, listPublicWork, viewerMayCreate } from "@/missions/projects";

export const dynamic = "force-dynamic";

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const mission = await getPublicMission(await getMissionDb(), slug);
    return { title: mission?.name ?? slug };
  } catch {
    return { title: slug };
  }
}

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let mission: Awaited<ReturnType<typeof getPublicMission>>;
  let projects: Awaited<ReturnType<typeof listPublicProjects>> = [];
  const workByProject = new Map<string, PublicWork[]>();
  let canCreate = false;
  let viewerEmail = "";
  let offers: CreatorOffer[] = [];
  try {
    const db = await getMissionDb();
    mission = await getPublicMission(db, slug);
    if (mission) {
      projects = await listPublicProjects(db, slug);
      for (const project of projects) workByProject.set(project.slug, (await listPublicWork(db, slug, project.slug)).slice().reverse());
      try {
        const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
        if (identity) {
          viewerEmail = identity.email;
          canCreate = await viewerMayCreate(db, slug, identity.uid);
          const utility = utilityByName(mission.name);
          if (canCreate && utility) offers = await listCreatorOffers(db, utilitySlug(utility.name));
        }
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!mission) notFound();
  const utility = utilityByName(mission.name);
  const others = offers.filter((offer) => offer.email !== viewerEmail);
  const titles = new Set([...workByProject.values()].flat().map((item) => item.title));
  const loose = others.filter((offer) => !titles.has(offer.piece));
  const lookingAfter = others.length > 0
    ? "You are looking after this list. People who were waiting are invited to the piece they chose. They post what they did there."
    : "You are looking after this list. No one is waiting yet. The pieces below are open.";
  function pieceHref(title: string, workHref: string) {
    if (!canCreate && utility) return `/use/${utilitySlug(utility.name)}?piece=${encodeURIComponent(title)}#help`;
    return workHref;
  }
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{utility?.genre ?? "Started"}</p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{mission.name}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{mission.purpose}</p>
      <p className="mt-4 text-[var(--ink)]">{canCreate ? lookingAfter : "Pick one piece. You do not need to write code."}</p>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--ink)]">The pieces</h2>
        {projects.length === 0 ? <p className="mt-2 text-[var(--muted)]">{missionEmptyStates.projects}</p> : (
          projects.map((project) => (
            <div key={project.slug} className="mt-4">
              <p className="text-[var(--body)]">{project.outcome}</p>
              <ul className="mt-6 space-y-6">
                {(workByProject.get(project.slug) ?? []).map((item) => {
                  const people = others.filter((offer) => offer.piece === item.title);
                  return (
                    <li key={item.slug}>
                      <Link href={pieceHref(item.title, publicWorkUrl(mission.slug, project.slug, item.slug))} className={actionClass}>{item.title}</Link>
                      <p className="mt-1 text-[var(--body)]">{item.description}</p>
                      {people.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {people.map((offer) => (
                            <li key={offer.id}>
                              <p className="text-[var(--ink)]">{offer.email}</p>
                              {offer.note ? <p className="text-[var(--body)]">{offer.note}</p> : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
        {canCreate && projects.length === 0 ? <p className="mt-4"><Link href={`/missions/${mission.slug}/projects/new`} className="font-semibold text-[var(--ink)]">Create a Project</Link></p> : null}
      </section>
      {loose.length > 0 ? (
        <section className="mt-10 border-t border-[var(--line)] pt-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Also on the list</h2>
          <ul className="mt-4 space-y-4">
            {loose.map((offer) => (
              <li key={offer.id}>
                <p className="text-[var(--ink)]">{offer.piece || helpKinds.find((kind) => kind.id === offer.kind)?.label}. {offer.email}</p>
                {offer.note ? <p className="mt-1 text-[var(--body)]">{offer.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-10 font-[family-name:var(--font-sans)] text-sm">
        {utility ? <><Link href={`/use/${utilitySlug(utility.name)}`} className="text-[var(--muted)]">{utility.name}</Link>{" · "}</> : null}
        <Link href="/use" className="text-[var(--muted)]">All utilities</Link>
      </p>
    </article>
  );
}
