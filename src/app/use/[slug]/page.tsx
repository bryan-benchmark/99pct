import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { RideFare } from "@/components/RideFare";
import { GrowthBanner } from "@/components/GrowthBanner";
import { productCopy } from "@/content/99pct";
import { ConfirmHelpForm } from "@/app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/ConfirmHelpForm";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { helpKinds, startUtilityPath, utilityBySlug, utilitySlug } from "@/content/utilities";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { findStartedUtility } from "@/missions/growth";
import { getOwnInterest } from "@/missions/interest";
import { publicMissionUrl, publicWorkUrl, type ParticipationState } from "@/missions/model";
import { listPieceCounts, listPublicOfferCounts, ownOffer } from "@/missions/offers";
import { listPublicProjects, listPublicWork, viewerMayCreate } from "@/missions/projects";
import { beginUtilityPath, firstWeek } from "@/missions/starter";

export const dynamic = "force-dynamic";

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";
const primaryClass = "inline-flex min-h-11 w-full items-center justify-center border border-[var(--ink)] px-4 py-2 font-[family-name:var(--font-sans)] text-sm font-semibold sm:w-auto";

function kindLabel(kind: string) {
  return helpKinds.find((item) => item.id === kind)?.label ?? kind;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ piece?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const utility = utilityBySlug(slug);
  const piece = utility ? firstWeek(utility).work.find((item) => item.title === query.piece) : undefined;
  return { title: piece?.title ?? utility?.name ?? "Utility" };
}

async function placeOnPiece(missionSlug: string, title: string, uid: string | null) {
  const db = await getMissionDb();
  for (const project of await listPublicProjects(db, missionSlug)) {
    const match = (await listPublicWork(db, missionSlug, project.slug)).find((item) => item.title === title);
    if (!match) continue;
    let state: "creator" | ParticipationState | null = null;
    if (uid) {
      state = await viewerMayCreate(db, missionSlug, uid) ? "creator" : (await getOwnInterest(db, missionSlug, project.slug, match.slug, uid))?.state ?? null;
    }
    return { href: publicWorkUrl(missionSlug, project.slug, match.slug), missionSlug, projectSlug: project.slug, workSlug: match.slug, state };
  }
  return null;
}

export default async function UtilityPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ piece?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const utility = utilityBySlug(slug);
  if (!utility || utilitySlug(utility.name) !== slug) notFound();
  const kit = firstWeek(utility);
  const requested = kit.work.some((item) => item.title === query.piece) ? query.piece : "";
  let helpers = 0;
  const pieceCounts = new Map<string, number>();
  let started: { slug: string } | null = null;
  let own: Awaited<ReturnType<typeof ownOffer>> = null;
  let signedIn = false;
  let viewerUid: string | null = null;
  try {
    const db = await getMissionDb();
    helpers = (await listPublicOfferCounts(db)).find((row) => row.slug === slug)?.count ?? 0;
    for (const row of await listPieceCounts(db, slug)) pieceCounts.set(row.piece, row.count);
    started = await findStartedUtility(db, utility.name);
    try {
      const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
      signedIn = Boolean(identity);
      viewerUid = identity?.uid ?? null;
      if (identity) own = await ownOffer(db, slug, identity.uid);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
    }
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  const steward = kit.work.some((item) => item.title === "Look after the list");
  const chosen = kit.work.find((item) => item.title === requested) ?? null;
  const onThisPiece = Boolean(chosen && own?.piece === chosen.title);
  const helpPath = requested ? `/use/${slug}?piece=${encodeURIComponent(requested)}#help` : `/use/${slug}#help`;
  const join = `/sign-in?mode=create&next=${encodeURIComponent(helpPath)}`;
  const selectedPiece = requested || own?.piece || "";
  let place: Awaited<ReturnType<typeof placeOnPiece>> = null;
  if (started && onThisPiece && chosen) {
    try {
      place = await placeOnPiece(started.slug, chosen.title, viewerUid);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
    }
  }
  const waiting = steward
    ? "Raising your hand puts you on the list. The person who takes Look after the list starts it, and you are invited to this piece."
    : "Raising your hand puts you on the list. When someone starts this, you are invited to this piece.";
  const nextLine = place?.state === "creator"
    ? "This is not a live service. You are looking after the list."
    : place?.state === "invited"
      ? "This is not a live service. You're invited to this piece."
      : place?.state === "helping"
        ? "This is not a live service. Post what you did. Your name stays on it."
        : started
          ? "This is not a live service. Raising your hand invites you to this piece. You confirm it, then you post what you did."
          : chosen?.title === "Look after the list"
            ? "This is not a live service. Taking this starts it. People who already chose a piece are invited."
            : `This is not a live service. ${waiting}`;
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      {chosen ? (
        <section id="help">
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            <Link href={`/use/${slug}`}>{utility.name}</Link>
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{chosen.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{chosen.description}</p>
          {utility.name === "Rideshare 99" && chosen.title === "Sketch the first screen" ? <RideFare /> : null}
          <p className="mt-4 text-[var(--ink)]">{nextLine}</p>
          {onThisPiece ? (
            <div className="mt-6">
              {place?.state === "helping" ? (
                <p className="phone-actions"><Link href={place.href} className={primaryClass}>Post what you did</Link></p>
              ) : place?.state === "invited" ? (
                <ConfirmHelpForm missionSlug={place.missionSlug} projectSlug={place.projectSlug} workSlug={place.workSlug} />
              ) : place?.state === "creator" && started ? (
                <p className="phone-actions"><Link href={publicMissionUrl(started.slug)} className={primaryClass}>See the list</Link></p>
              ) : (
                <>
                  <p className="text-lg text-[var(--ink)]">You are on this piece.</p>
                  <p className="mt-3 text-[var(--body)]">{steward && chosen.title !== "Look after the list" ? (
                    <>When someone takes <Link href={`/use/${slug}?piece=${encodeURIComponent("Look after the list")}#help`} className="font-semibold text-[var(--ink)]">Look after the list</Link>, you are invited. Or take that piece and start it.</>
                  ) : "When someone starts this, you are invited."}</p>
                </>
              )}
            </div>
          ) : signedIn ? (
            <OfferForm slug={slug} pieces={kit.work.map((item) => item.title)} selected={chosen.title} own={own ? { piece: own.piece, note: own.note } : null} />
          ) : (
            <p className="phone-actions mt-6"><Link href={join} className={primaryClass}>Join and do this</Link></p>
          )}
          <p className="mt-6 text-[var(--body)]">{productCopy.mcu.meaning}</p>
        </section>
      ) : (
        <>
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{utility.genre}</p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{utility.name}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{`The open version of ${utility.incumbent}. ${utility.line}`}</p>
          {utility.name === "Rideshare 99" ? <RideFare /> : null}
          <p className="mt-4 text-[var(--ink)]">{started
            ? "This is not a live service. Raising your hand invites you to the piece you chose. You confirm it."
            : steward
              ? "This is not a live service. Raising your hand puts you on the list. The person who takes Look after the list starts it, and you are invited to the piece you chose. You confirm it."
              : "This is not a live service. Raising your hand puts you on the list. When someone starts this, you are invited to the piece you chose. You confirm it."}</p>
          {helpers > 0 ? <p className="mt-4 text-[var(--body)]">{helpers === 1 ? "1 person can help." : `${helpers} people can help.`}</p> : null}
          {own ? <p className="mt-4 text-[var(--body)]">You are on the list for {own.piece || kindLabel(own.kind)}.</p> : null}
        </>
      )}
      {chosen ? null : (
        <p className="phone-actions mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
          {started ? <Link href={publicMissionUrl(started.slug)} className={actionClass}>Go to the utility</Link> : null}
          <Link href={started ? startUtilityPath(utility) : beginUtilityPath(utility)} className={actionClass}>{started ? "Start a separate one" : "Start this"}</Link>
          <Link href="/use" className={actionClass}>All utilities</Link>
        </p>
      )}
      <section id="first-week" className="mt-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{chosen ? "Other pieces" : "The first week"}</h2>
        <ul className="mt-6 space-y-6">
          {kit.work.filter((item) => item.title !== chosen?.title).map((item) => (
            <li key={item.title}>
              <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-1 text-[var(--body)]">{item.description}</p>
              {(pieceCounts.get(item.title) ?? 0) > 0 ? <p className="mt-1 text-[var(--body)]">{pieceCounts.get(item.title) === 1 ? "1 person can do this." : `${pieceCounts.get(item.title)} people can do this.`}</p> : null}
              <p className="phone-actions mt-2 font-[family-name:var(--font-sans)]"><Link href={`/use/${slug}?piece=${encodeURIComponent(item.title)}#help`} className={actionClass}>I can do this</Link></p>
            </li>
          ))}
        </ul>
      </section>
      {chosen ? (
        <p className="mt-8 font-[family-name:var(--font-sans)] text-sm">
          {started ? <><Link href={publicMissionUrl(started.slug)} className={actionClass}>Go to the utility</Link>{" · "}</> : null}
          <Link href="/use" className="text-[var(--muted)]">All utilities</Link>
        </p>
      ) : null}
      {chosen ? null : (
        <section id="help" className="mt-12">
          <h2 className="text-xl font-semibold text-[var(--ink)]">I can help</h2>
          {signedIn ? <OfferForm slug={slug} pieces={kit.work.map((item) => item.title)} selected={selectedPiece} own={own ? { piece: own.piece, note: own.note } : null} /> : (
            <p className="phone-actions mt-4 font-[family-name:var(--font-sans)]"><Link href={join} className={actionClass}>Join to raise your hand</Link></p>
          )}
        </section>
      )}
    </article>
  );
}
