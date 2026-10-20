import Link from "next/link";
import { GrowthBanner } from "@/components/GrowthBanner";
import { helpCopy } from "@/content/99pct";

export const metadata = { title: helpCopy.title };

const actionClass = "font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

export default function HelpPage() {
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <GrowthBanner />
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{helpCopy.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)]">{helpCopy.lede}</p>
      <p className="mt-4 text-[var(--body)]">{helpCopy.free}</p>
      <div className="mt-10 space-y-10">
        {helpCopy.steps.map((step) => (
          <section key={step.title}>
            <h2 className="text-xl font-semibold text-[var(--ink)]">{step.title}</h2>
            <p className="mt-3 text-[var(--body)]">{step.body}</p>
            <p className="mt-3 font-[family-name:var(--font-sans)]">
              <Link href={step.href} className={actionClass}>{step.label}</Link>
            </p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-[var(--muted)]">Offering to help is not a job, a paycheck, or ownership.</p>
    </article>
  );
}
