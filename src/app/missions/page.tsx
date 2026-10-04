import Link from "next/link";
import { getMissionDb } from "@/missions/db/runtime";
import { listPublicMissions } from "@/missions/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Missions" };

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
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">Missions</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">
        Forming Missions are public starting points. A Mission here is not a company, a contract, or an ownership grant.
      </p>
      <p className="mt-6 font-[family-name:var(--font-sans)]">
        <Link href="/missions/new" className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">Start a Mission</Link>
      </p>
      {unavailable ? <p className="mt-10 text-[var(--muted)]">Missions are not available in this environment yet.</p> : null}
      {!unavailable && missions.length === 0 ? <p className="mt-10 text-[var(--muted)]">No missions have been started yet.</p> : null}
      <ul className="mt-10 space-y-8">
        {missions.map((mission) => (
          <li key={mission.slug} className="border-t border-[var(--line)] pt-6">
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Forming</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
              <Link href={`/missions/${mission.slug}`}>{mission.name}</Link>
            </h2>
            <p className="mt-3 text-[var(--body)]">{mission.purpose}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">For {mission.beneficiaries}. Starts in {mission.startingPlace}.</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
