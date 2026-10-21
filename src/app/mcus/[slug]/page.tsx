import Link from "next/link";
import { notFound } from "next/navigation";
import { productCopy } from "@/content/99pct";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { listMcusBySlug } from "@/missions/mcu";
import { publicWorkUrl } from "@/missions/model";

export const dynamic = "force-dynamic";

export default async function McuPersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let pieces: Awaited<ReturnType<typeof listMcusBySlug>> = [];
  try {
    pieces = await listMcusBySlug(await getMissionDb(), slug);
  } catch (error) {
    if (error instanceof Error && error.message === missionDatabaseUnavailable) notFound();
    throw error;
  }
  if (pieces.length === 0) notFound();
  const name = pieces[0].name;
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">MCU</p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{name}</h1>
      <p className="mt-6 text-[var(--ink)]">{pieces.length === 1 ? "1 piece with this name on it." : `${pieces.length} pieces with this name on them.`}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.mcu.meaning}</p>
      <ul className="mt-8 space-y-6">
        {pieces.map((item) => (
          <li key={item.id}>
            <Link href={publicWorkUrl(item.missionSlug, item.projectSlug, item.workSlug)} className="font-semibold text-[var(--ink)]">{item.piece}</Link>
            <p className="mt-1 text-[var(--muted)]">{item.utility}</p>
            <p className="mt-1 text-[var(--body)]">{item.summary}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 font-[family-name:var(--font-sans)]">
        <Link href="/mcus" className="inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">See the names</Link>
      </p>
    </article>
  );
}
