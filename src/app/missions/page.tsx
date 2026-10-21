import Link from "next/link";
import { getMissionDb } from "@/missions/db/runtime";
import { listPublicMissions } from "@/missions/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "What has been started" };

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default async function MissionsPage() {
  let missions: Awaited<ReturnType<typeof listPublicMissions>> = [];
  let unavailable = false;
  try {
    missions = await listPublicMissions(await getMissionDb());
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Mission database is not configured.") throw error;
    unavailable = true;
  }
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">What has been started</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">These are utilities people have started. Open one and pick a piece.</p>
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href="/use/rideshare-99" className={actionClass}>Start with Rideshare 99</Link>
        <Link href="/use" className={actionClass}>See the utilities</Link>
      </p>
      {unavailable ? <p className="mt-10 text-[var(--muted)]">This list is not available in this environment yet.</p> : null}
      {!unavailable && missions.length === 0 ? <p className="mt-10 text-[var(--muted)]">Nothing has been started yet.</p> : null}
      <ul className="mt-10 space-y-8">
        {missions.map((mission) => (
          <li key={mission.slug} className="border-t border-[var(--line)] pt-6">
            <h2 className="text-xl font-semibold text-[var(--ink)]">
              <Link href={`/missions/${mission.slug}`} className="inline-flex min-h-11 items-center">{mission.name}</Link>
            </h2>
            <p className="mt-3 text-[var(--body)]">{mission.purpose}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
