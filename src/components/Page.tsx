import type { ReactNode } from "react";
import { DocStatus, type SourceKind } from "@/components/DocStatus";

export function Page({
  title,
  lede,
  source,
  sourceKind = "canonical",
  children,
}: {
  title: string;
  lede?: string;
  source?: string;
  sourceKind?: SourceKind;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[2.25rem]">
        {title}
      </h1>
      {lede ? (
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">{lede}</p>
      ) : null}
      <DocStatus source={source} sourceKind={sourceKind} />
      <div className="prose-mission mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function Section({
  title,
  children,
  badge,
}: {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-[var(--line)] pt-8">
      <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span>{title}</span>
        {badge}
      </h2>
      <div className="space-y-3 text-[1.0625rem] leading-relaxed text-[var(--body)]">
        {children}
      </div>
    </section>
  );
}
