import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { GrowthBanner } from "@/components/GrowthBanner";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { helpKinds, startUtilityPath, utilityBySlug, utilitySlug } from "@/content/utilities";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { findStartedUtility } from "@/missions/growth";
import { publicMissionUrl } from "@/missions/model";
import { listPublicOfferCounts, ownOffer } from "@/missions/offers";
import { firstWeek } from "@/missions/starter";

export const dynamic = "force-dynamic";

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

function kindLabel(kind: string) {
  return helpKinds.find((item) => item.id === kind)?.label ?? kind;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const utility = utilityBySlug(slug);
  return { title: utility?.name ?? "Utility" };
}

export default async function UtilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const utility = utilityBySlug(slug);
  if (!utility || utilitySlug(utility.name) !== slug) notFound();
  const kit = firstWeek(utility);
  let helpers = 0;
  let started: { slug: string } | null = null;
  let own: Awaited<ReturnType<typeof ownOffer>> = null;
  let signedIn = false;
  try {
    const db = await getMissionDb();
    helpers = (await listPublicOfferCounts(db)).find((row) => row.slug === slug)?.count ?? 0;
    started = await findStartedUtility(db, utility.name);
    try {
      const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
      signedIn = Boolean(identity);
      if (identity) own = await ownOffer(db, slug, identity.uid);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
    }
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  const join = `/sign-in?mode=create&next=/use/${slug}`;
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{utility.genre}</p>
      <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{utility.name}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{`The open version of ${utility.incumbent}. ${utility.line}`}</p>
      <p className="mt-4 text-[var(--ink)]">This is not a live service. Raising your hand puts you on the list. Starting it posts the first week of work.</p>
      {helpers > 0 ? <p className="mt-4 text-[var(--body)]">{helpers === 1 ? "1 person can help." : `${helpers} people can help.`}</p> : null}
      {own ? <p className="mt-4 text-[var(--body)]">You are on the list for {kindLabel(own.kind)}.</p> : null}
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        {started ? <Link href={publicMissionUrl(started.slug)} className={actionClass}>Go to the utility</Link> : null}
        <Link href={startUtilityPath(utility)} className={actionClass}>{started ? "Start a separate one" : "Start this"}</Link>
        <Link href="/use" className={actionClass}>All utilities</Link>
      </p>
      <section id="first-week" className="mt-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">The first week</h2>
        <ul className="mt-6 space-y-6">
          {kit.work.map((item) => (
            <li key={item.title}>
              <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-1 text-[var(--body)]">{item.description}</p>
              <p className="mt-1 text-[var(--muted)]">{`Done when ${item.doneWhen.charAt(0).toLowerCase()}${item.doneWhen.slice(1)}`}</p>
            </li>
          ))}
        </ul>
      </section>
      <section id="help" className="mt-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">I can help</h2>
        {signedIn ? <OfferForm slug={slug} own={own} /> : (
          <p className="mt-4 font-[family-name:var(--font-sans)]"><Link href={join} className={actionClass}>Join to raise your hand</Link></p>
        )}
      </section>
    </article>
  );
}
