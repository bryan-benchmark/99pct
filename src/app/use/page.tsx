import Link from "next/link";
import { productCopy, useCopy } from "@/content/99pct";

export const metadata = { title: useCopy.title };

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default function UsePage() {
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{useCopy.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{useCopy.lede}</p>
      <h2 className="mt-10 font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{useCopy.examplesTitle}</h2>
      <ul className="mt-4 space-y-2 text-[var(--body)]">
        {useCopy.examples.map((example) => <li key={example}>{example}</li>)}
      </ul>
      <p className="mt-8 text-lg text-[var(--ink)]">{useCopy.empty}</p>
      <p className="mt-4 text-[var(--body)]">{useCopy.substrate}</p>
      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
        <Link href={useCopy.build.href} className={actionClass}>{useCopy.build.label}</Link>
        <Link href={productCopy.start.href} className={actionClass}>{productCopy.start.label}</Link>
        <Link href={productCopy.explore.href} className={actionClass}>{productCopy.explore.label}</Link>
      </p>
    </article>
  );
}
