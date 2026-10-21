import Link from "next/link";
import { AgentHandoff } from "@/components/AgentHandoff";
import { GrowthBanner } from "@/components/GrowthBanner";
import { HeroCompare } from "@/components/HeroCompare";
import { agentNote, anyBrickPrompt, brickPrompt, brickRepo } from "@/content/agentBrick";
import { productCopy } from "@/content/99pct";
import { heroIncumbents, utilityByName } from "@/content/utilities";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { lifeSentence, publicPulse } from "@/missions/growth";
import { listRecentMcus, type PublicMcu } from "@/missions/mcu";
import { listPieceCounts } from "@/missions/offers";
import { beginUtilityPath, firstWeek } from "@/missions/starter";

export const dynamic = "force-dynamic";

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";
const primaryClass = "inline-flex min-h-11 w-full items-center justify-center border border-[var(--ink)] px-4 py-2 font-[family-name:var(--font-sans)] text-sm font-semibold sm:w-auto";
const rideshare = utilityByName("Rideshare 99");
const firstWeekWork = rideshare ? firstWeek(rideshare).work : [];

export default async function HomePage() {
  let life = "";
  let mcus: PublicMcu[] = [];
  const pieceCounts = new Map<string, number>();
  try {
    const db = await getMissionDb();
    life = lifeSentence(await publicPulse(db));
    mcus = await listRecentMcus(db, 5);
    for (const row of await listPieceCounts(db, "rideshare-99")) pieceCounts.set(row.piece, row.count);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-8 md:py-16">
      <GrowthBanner />
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.eyebrow}</p>
      <HeroCompare names={heroIncumbents} headline={productCopy.headline} rows={productCopy.split.rows}>
        <p className="mt-3 font-[family-name:var(--font-sans)] text-sm text-[#767676]">{productCopy.quote}</p>
      </HeroCompare>
      <p className="mt-4 text-[var(--body)]">{productCopy.argument} No utility is a live service yet.</p>
      <section id="help" className="mt-10 scroll-mt-6">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.helpNow.title}</h2>
        <p className="mt-3 text-lg leading-relaxed text-[var(--body)]">{productCopy.lede}</p>
        {life ? <p className="mt-3 text-[var(--ink)]">{life}</p> : null}
        <p className="mt-6 text-[var(--body)]">{agentNote}</p>
        <p className="mt-3 font-[family-name:var(--font-sans)]"><a href={brickRepo} className={actionClass}>The public wall</a></p>
        <AgentHandoff prompt={anyBrickPrompt()} label="Copy for your agent" />
        <p className="phone-actions mt-6">
          <Link href={productCopy.helpNow.action.href} className={primaryClass}>{productCopy.helpNow.action.label}</Link>
        </p>
        <ul className="mt-8 space-y-0">
          {firstWeekWork.map((item) => (
            <li key={item.title} className="border-t border-[var(--line)] py-3">
              <Link href={`/use/rideshare-99?piece=${encodeURIComponent(item.title)}#help`} className="inline-flex min-h-11 items-center font-semibold text-[var(--ink)]">{item.title}</Link>
              {(pieceCounts.get(item.title) ?? 0) > 0 ? <p className="text-[var(--body)]">{pieceCounts.get(item.title) === 1 ? "1 person can do this." : `${pieceCounts.get(item.title)} people can do this.`}</p> : null}
              <AgentHandoff prompt={brickPrompt(item)} label="Copy this brick" quiet />
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.mcu.title}</h2>
        <p className="mt-3 text-[var(--body)]">{productCopy.mcu.meaning}</p>
        {mcus.length === 0 ? <p className="mt-3 text-[var(--ink)]">{productCopy.mcu.empty}</p> : (
          <ul className="mt-4 space-y-4">
            {mcus.map((item) => (
              <li key={item.id}>
                <Link href={`/mcus/${item.slug}`} className="font-semibold text-[var(--ink)]">{item.name}</Link>
                <span className="text-[var(--body)]">{` · ${item.piece}`}</span>
                <p className="text-[var(--body)]">{item.summary}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 font-[family-name:var(--font-sans)]"><Link href={productCopy.mcu.href} className={actionClass}>{productCopy.mcu.label}</Link></p>
      </section>
      <section id="faq" className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.faq.title}</h2>
        <dl className="mt-6 space-y-6">
          {productCopy.faq.items.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-[var(--ink)]">{item.q}</dt>
              <dd className="mt-2 text-[var(--body)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href={productCopy.helpNow.action.href} className={actionClass}>{productCopy.helpNow.action.label}</Link>
        <Link href={productCopy.use.href} className={actionClass}>{productCopy.use.label}</Link>
        <Link href={productCopy.build.href} className={actionClass}>{productCopy.build.label}</Link>
        {rideshare ? <Link href={beginUtilityPath(rideshare)} className={actionClass}>Start Rideshare 99</Link> : <Link href={productCopy.start.href} className={actionClass}>{productCopy.start.label}</Link>}
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
