"use client";

import { useState } from "react";
import { fareCents, formatFare, splitFare } from "@/rideshare/fare";

const field = "mt-1 block min-h-11 w-full border border-[var(--line)] bg-white p-2 text-base";

function place(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function RideFare() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fare, setFare] = useState("12.00");
  const cents = fareCents(fare);
  const split = cents === null ? null : splitFare(cents);
  const origin = place(from);
  const destination = place(to);
  const trip = origin && destination ? `A ride from ${origin} to ${destination}.` : "A ride across town.";
  const rows = split
    ? [
        ["~99%", "The person who drove", split.driver],
        ["~1%", "The people who keep the infrastructure running", split.infrastructure],
        ["0%", "Outside owners", split.outside],
      ] as const
    : [];
  return (
    <section id="ride" className="mt-8 scroll-mt-6">
      <h2 className="text-xl font-semibold text-[var(--ink)]">Who keeps the fare</h2>
      <p className="mt-3 text-lg text-[var(--ink)]">{trip}</p>
      <div className="mt-4 space-y-4 font-[family-name:var(--font-sans)] text-sm">
        <label className="block">Where you are
          <input className={field} value={from} onChange={(event) => setFrom(event.target.value)} autoComplete="off" />
        </label>
        <label className="block">Where you&apos;re going
          <input className={field} value={to} onChange={(event) => setTo(event.target.value)} autoComplete="off" />
        </label>
        <label className="block">Fare, in dollars
          <input className={field} inputMode="decimal" value={fare} onChange={(event) => setFare(event.target.value)} />
        </label>
      </div>
      {split ? (
        <table className="mt-6 w-full border-collapse text-[var(--ink)]">
          <caption className="mb-1 text-left font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Where this fare stays</caption>
          <tbody>
            {rows.map(([share, who, amount]) => (
              <tr key={share} className="border-t border-[var(--line)]">
                <th scope="row" className="w-[4.5rem] whitespace-nowrap py-3 pr-4 text-left align-baseline text-[1.75rem] font-semibold leading-none tracking-tight">{share}</th>
                <td className="py-3 align-baseline">{who}</td>
                <td className="whitespace-nowrap py-3 text-right align-baseline font-semibold tabular-nums">{formatFare(amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="mt-4 text-[var(--body)]">Enter a fare from 0 to 1000 dollars.</p>}
      <p className="mt-4 text-[var(--body)]">This is not a live ride. No one is paid.</p>
    </section>
  );
}
