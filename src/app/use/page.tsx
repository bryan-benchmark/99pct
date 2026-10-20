import Link from "next/link";
import { GrowthBanner } from "@/components/GrowthBanner";
import { UtilityCatalog } from "@/components/UtilityCatalog";
import { productCopy, useCopy } from "@/content/99pct";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { listPublicOfferCounts } from "@/missions/offers";

export const dynamic = "force-dynamic";
export const metadata = { title: useCopy.title };

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default async function UsePage() {
  let counts: Record<string, number> = {};
  try {
    counts = Object.fromEntries((await listPublicOfferCounts(await getMissionDb())).map((row) => [row.slug, row.count]));
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{useCopy.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{useCopy.lede}</p>
      <p className="mt-4 text-lg text-[var(--ink)]">{useCopy.empty}</p>
      <p className="mt-4 text-[var(--body)]">{useCopy.substrate}</p>
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href={useCopy.build.href} className={actionClass}>{useCopy.build.label}</Link>
        <Link href={productCopy.start.href} className={actionClass}>{productCopy.start.label}</Link>
        <Link href={productCopy.explore.href} className={actionClass}>{productCopy.explore.label}</Link>
      </p>
      <UtilityCatalog counts={counts} />
    </article>
  );
}
