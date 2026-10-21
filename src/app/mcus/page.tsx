import Link from "next/link";
import { productCopy } from "@/content/99pct";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { listMcuBoard, type McuPerson } from "@/missions/mcu";

export const dynamic = "force-dynamic";
export const metadata = { title: "MCUs" };

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default async function McuPage() {
  let people: McuPerson[] = [];
  try {
    people = await listMcuBoard(await getMissionDb());
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{productCopy.mcu.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{productCopy.mcu.meaning}</p>
      <p className="mt-4 text-[var(--ink)]">The newest name is first. There is no score.</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.argument}</p>
      {people.length === 0 ? <p className="mt-8 text-[var(--ink)]">{productCopy.mcu.empty}</p> : (
        <ul className="mt-8 space-y-6">
          {people.map((person) => {
            const latest = person.pieces[0];
            return (
              <li key={person.slug}>
                <Link href={`/mcus/${person.slug}`} className="text-lg font-semibold text-[var(--ink)]">{person.name}</Link>
                <p className="mt-1 text-[var(--ink)]">{latest.piece}</p>
                <p className="text-[var(--body)]">{person.pieces.length === 1 ? latest.utility : `${latest.utility} · ${person.pieces.length} pieces`}</p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-8 font-[family-name:var(--font-sans)]">
        <Link href={people.length === 0 ? productCopy.join.href : "/use/rideshare-99"} className={actionClass}>{people.length === 0 ? "Join and put your name here" : "Pick a piece"}</Link>
      </p>
    </article>
  );
}
