import Link from "next/link";
import { GrowthBanner } from "@/components/GrowthBanner";
import { RotatingVersion } from "@/components/RotatingVersion";
import { productCopy } from "@/content/99pct";
import { heroIncumbents, startUtilityPath, utilityByName } from "@/content/utilities";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { lifeSentence, publicPulse } from "@/missions/growth";
import { listPieceCounts } from "@/missions/offers";
import { firstWeek } from "@/missions/starter";

export const dynamic = "force-dynamic";

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";
const rideshare = utilityByName("Rideshare 99");
const firstWeekWork = rideshare ? firstWeek(rideshare).work : [];

export default async function HomePage() {
  let life = "";
  const pieceCounts = new Map<string, number>();
  try {
    const db = await getMissionDb();
    life = lifeSentence(await publicPulse(db));
    for (const row of await listPieceCounts(db, "rideshare-99")) pieceCounts.set(row.piece, row.count);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-8 md:py-16">
      <GrowthBanner />
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.eyebrow}</p>
      <h1 className="mt-3 min-h-[2.6em] text-[clamp(1.65rem,4.6vw,2.75rem)] font-semibold leading-tight tracking-tight text-[var(--ink)]">
        <span className="sr-only">{productCopy.headline}</span>
        <RotatingVersion names={heroIncumbents} />
      </h1>
      <p className="mt-4 text-lg text-[var(--ink)]">{productCopy.gloss}</p>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)] md:text-xl">{productCopy.lede}</p>
      <table className="mt-8 w-full border-collapse text-[var(--ink)]">
        <caption className="mb-1 text-left font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.split.caption}</caption>
        <tbody>
          {productCopy.split.rows.map((row) => (
            <tr key={row.share} className="border-t border-[var(--line)]">
              <th scope="row" className="w-[5.5rem] whitespace-nowrap py-3 pr-4 text-left align-baseline text-[1.75rem] font-semibold leading-none tracking-tight">{row.share}</th>
              <td className="py-3 align-baseline">{row.who}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[var(--body)]">{productCopy.argument}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.truth}</p>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ink)]">The first week of Rideshare 99</h2>
        <p className="mt-3 text-[var(--body)]">Six pieces. None of them is the software. Say you can help with one, or start the utility and these become the work other people can do.</p>
        {life ? <p className="mt-3 text-[var(--ink)]">{life}</p> : null}
        <ol className="mt-6 list-decimal space-y-4 pl-5">
          {firstWeekWork.map((item) => (
            <li key={item.title}>
              <Link href={`/use/rideshare-99?piece=${encodeURIComponent(item.title)}#help`} className="inline-flex min-h-11 items-center font-semibold text-[var(--ink)]">{item.title}</Link>
              <p className="text-[var(--muted)]">{`Done when ${item.doneWhen.charAt(0).toLowerCase()}${item.doneWhen.slice(1)}`}</p>
              {(pieceCounts.get(item.title) ?? 0) > 0 ? <p className="text-[var(--ink)]">{pieceCounts.get(item.title) === 1 ? "1 person can do this." : `${pieceCounts.get(item.title)} people can do this.`}</p> : null}
            </li>
          ))}
        </ol>
        {rideshare ? (
          <p className="phone-actions mt-6 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
            <Link href="/use/rideshare-99#help" className={actionClass}>I can help</Link>
            <Link href={startUtilityPath(rideshare)} className={actionClass}>Start Rideshare 99</Link>
          </p>
        ) : null}
      </section>
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href={productCopy.join.href} className={actionClass}>{productCopy.join.label}</Link>
        <Link href={productCopy.use.href} className={actionClass}>{productCopy.use.label}</Link>
        <Link href={productCopy.build.href} className={actionClass}>{productCopy.build.label}</Link>
        <Link href={productCopy.start.href} className={actionClass}>{productCopy.start.label}</Link>
      </p>
      <p className="mt-4 font-[family-name:var(--font-sans)]">
        <Link href={productCopy.explore.href} className="text-[var(--muted)]">{productCopy.explore.label}</Link>
      </p>
      <p className="mt-10 font-[family-name:var(--font-sans)] text-sm">
        <Link href={productCopy.help.href}>{productCopy.help.label}</Link>
        {" · "}
        <Link href={productCopy.protocolLink.href}>{productCopy.protocolLink.label}</Link>
      </p>
    </article>
  );
}
