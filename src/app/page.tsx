import Link from "next/link";
import { productCopy } from "@/content/99pct";

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default function HomePage() {
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.eyebrow}</p>
      <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[2.75rem]">{productCopy.headline}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)] md:text-xl">{productCopy.lede}</p>
      <p className="mt-4 text-[var(--body)]">{productCopy.futureRails}</p>
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href={productCopy.use.href} className={actionClass}>{productCopy.use.label}</Link>
        <Link href={productCopy.build.href} className={actionClass}>{productCopy.build.label}</Link>
        <Link href={productCopy.start.href} className={actionClass}>{productCopy.start.label}</Link>
      </p>
      <p className="mt-4 font-[family-name:var(--font-sans)]">
        <Link href={productCopy.explore.href} className="text-[var(--muted)]">{productCopy.explore.label}</Link>
      </p>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.modesTitle}</h2>
        <div className="mt-6 space-y-6">
          {productCopy.modes.map((mode) => (
            <div key={mode.label}>
              <h3 className="text-lg font-semibold text-[var(--ink)]">{mode.label}</h3>
              <p className="mt-1 text-[var(--body)]">{mode.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[var(--muted)]">{productCopy.modesTruth}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.growthTitle}</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.liveNowTitle}</h3>
            <ul className="mt-3 space-y-2 text-[var(--body)]">
              {productCopy.liveNow.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{productCopy.nextTitle}</h3>
            <ul className="mt-3 space-y-2 text-[var(--body)]">
              {productCopy.next.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.directionTitle}</h2>
        <div className="mt-4 space-y-3 text-[var(--body)]">
          {productCopy.direction.map((line) => <p key={line}>{line}</p>)}
        </div>
      </section>

      <section className="mt-14 border-t border-[var(--line)] pt-8">
        <h2 className="text-xl font-semibold text-[var(--ink)]">{productCopy.protocolTitle}</h2>
        <p className="mt-4 text-[var(--body)]">{productCopy.protocol}</p>
        <p className="mt-4 font-[family-name:var(--font-sans)]">
          <Link href={productCopy.protocolLink.href} className={actionClass}>{productCopy.protocolLink.label}</Link>
        </p>
      </section>

      <p className="mt-10 font-[family-name:var(--font-sans)] text-sm">
        <a href={productCopy.source.href}>{productCopy.source.label}</a>
      </p>
    </article>
  );
}
