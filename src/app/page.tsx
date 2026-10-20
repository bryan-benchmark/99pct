import Link from "next/link";
import { GrowthBanner } from "@/components/GrowthBanner";
import { RotatingVersion } from "@/components/RotatingVersion";
import { productCopy } from "@/content/99pct";
import { heroIncumbents, startUtilityPath, utilityByName } from "@/content/utilities";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { lifeSentence, publicPulse } from "@/missions/growth";

export const dynamic = "force-dynamic";

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";
const rideshare = utilityByName("Rideshare 99");

export default async function HomePage() {
  let life = "";
  try {
    life = lifeSentence(await publicPulse(await getMissionDb()));
  } catch (error) {
    if (!(error instanceof Error) || error.message !== missionDatabaseUnavailable) throw error;
  }
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.eyebrow}</p>
      <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[2.75rem]">
        <span className="sr-only">{productCopy.headline}</span>
        <RotatingVersion names={heroIncumbents} />
      </h1>
      <p className="mt-4 text-lg text-[var(--ink)]">{productCopy.gloss}</p>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)] md:text-xl">{productCopy.lede}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.argument}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.truth}</p>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Start with Rideshare 99</h2>
        <p className="mt-3 text-[var(--body)]">The first week is a description, a first city, and what a rider and a driver need. Starting it posts that work for other people. The software comes after.</p>
        {life ? <p className="mt-3 text-[var(--ink)]">{life}</p> : null}
        {rideshare ? (
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
            <Link href="/use/rideshare-99" className={actionClass}>I can help</Link>
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
