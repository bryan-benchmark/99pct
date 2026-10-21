"use client";

import type { ReactNode } from "react";
import { VersionLine, useRotatingName } from "@/components/RotatingVersion";
import { estimateShare, takeEstimates } from "@/content/takeRates";
import { formatFare, splitFare } from "@/rideshare/fare";

export function HeroCompare({ names, headline, rows, children }: {
  names: readonly string[];
  headline: string;
  rows: readonly { share: string; who: string }[];
  children: ReactNode;
}) {
  const name = useRotatingName(names);
  const estimate = takeEstimates[name];
  const ours = estimate ? splitFare(estimate.cents) : null;
  const them = estimate ? estimateShare(estimate.cents, estimate.work, estimate.infrastructure) : null;
  const labels = ["The people doing the job", "Infrastructure", "Corporate greed"];
  const lines = ours && them && estimate
    ? [
        { who: labels[0], them: them.workCents, ours: ours.driver, themPct: estimate.work, ourPct: rows[0]?.share ?? "~99%" },
        { who: labels[1], them: them.infrastructureCents, ours: ours.infrastructure, themPct: estimate.infrastructure, ourPct: rows[1]?.share ?? "~1%" },
        { who: labels[2], them: them.corporateCents, ours: ours.outside, themPct: estimate.corporate, ourPct: rows[2]?.share ?? "0%" },
      ]
    : [];
  return (
    <>
      <h1 className="mt-3 min-h-[1.3em] text-[clamp(1.65rem,4.6vw,2.75rem)] font-semibold leading-tight tracking-tight text-[var(--ink)]">
        <span className="sr-only">{headline}</span>
        <VersionLine name={name} />
      </h1>
      {children}
      {estimate ? (
        <table className="mt-8 w-full border-collapse text-[var(--ink)]">
          <caption className="mb-1 text-left font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {estimate.purchase}
            <span className="mt-1 block font-normal normal-case tracking-normal">Rounded estimates. Infrastructure includes the goods, the buildings, and the systems. The 99% column is the rule. This site does not pay it.</span>
          </caption>
          <thead>
            <tr className="border-t border-[var(--line)] font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-normal text-[var(--muted)] sm:text-xs sm:tracking-wide">
              <th className="py-2 pr-2 text-left font-medium">Who</th>
              <th className="py-2 text-right font-medium">{name}</th>
              <th className="py-2 pl-2 text-right font-medium sm:pl-3">99%</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.who} className="border-t border-[var(--line)]">
                <th scope="row" className="py-3 pr-2 text-left align-baseline font-normal sm:pr-3">{line.who}</th>
                <td className="whitespace-nowrap py-3 text-right align-baseline tabular-nums">
                  <span className="text-base font-semibold sm:text-lg">{formatFare(line.them)}</span>
                  <span className="block text-sm text-[var(--muted)]">{line.themPct}%</span>
                </td>
                <td className="whitespace-nowrap py-3 pl-2 text-right align-baseline tabular-nums sm:pl-3">
                  <span className="text-base font-semibold sm:text-lg">{formatFare(line.ours)}</span>
                  <span className="block text-sm text-[var(--muted)]">{line.ourPct}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
