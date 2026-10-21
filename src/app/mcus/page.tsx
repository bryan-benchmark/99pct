import Link from "next/link";
import { productCopy } from "@/content/99pct";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { listRecentMcus, type PublicMcu } from "@/missions/mcu";

export const dynamic = "force-dynamic";
export const metadata = { title: "MCUs" };

export default async function McuPage() {
  let mcus: PublicMcu[] = [];
  try {
    mcus = await listRecentMcus(await getMissionDb(), 40);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{productCopy.mcu.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{productCopy.mcu.meaning}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.argument}</p>
      {mcus.length === 0 ? <p className="mt-8 text-[var(--ink)]">{productCopy.mcu.empty}</p> : (
        <ul className="mt-8 space-y-6">
          {mcus.map((item) => (
            <li key={item.id}>
              <Link href={`/mcus/${item.slug}`} className="font-semibold text-[var(--ink)]">{item.name}</Link>
              <span className="text-[var(--body)]">{` · ${item.utility}`}</span>
              <p className="mt-1 text-[var(--ink)]">{item.piece}</p>
              <p className="text-[var(--body)]">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
