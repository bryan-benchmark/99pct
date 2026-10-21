"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { startUtilityPath, utilities, utilitySlug, type Utility } from "@/content/utilities";

const actionClass = "inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4";

function genresOf(items: readonly Utility[]) {
  return [...new Set(items.map((item) => item.genre))];
}

function helperLabel(count: number) {
  return count === 1 ? "1 person can help." : `${count} people can help.`;
}

export function UtilityCatalog({ counts }: { counts: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!needle) return utilities;
    return utilities.filter((item) => `${item.genre} ${item.name} ${item.incumbent} ${item.line}`.toLowerCase().includes(needle));
  }, [needle]);
  const genres = genresOf(shown);

  return (
    <div className="mt-10">
      <label className="block font-[family-name:var(--font-sans)] text-sm">
        Find a utility
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-1 block w-full border border-[var(--line)] bg-white p-2"
          type="search"
          autoComplete="off"
        />
      </label>
      {shown.length === 0 ? (
        <p className="mt-8 text-[var(--body)]">
          Nothing matches. <Link href="/missions/new" className={actionClass}>Start one anyway.</Link>
        </p>
      ) : null}
      {genres.map((genre) => (
        <section key={genre} className="mt-12">
          <h2 className="text-xl font-semibold text-[var(--ink)]">{genre}</h2>
          <ul className="mt-6 space-y-8">
            {shown.filter((item) => item.genre === genre).map((item) => (
              <li key={item.name}>
                <h3 className="text-lg font-semibold text-[var(--ink)]">{item.name}</h3>
                <p className="mt-1 text-[var(--body)]">{`The open version of ${item.incumbent}. ${item.line}`}</p>
                {counts[utilitySlug(item.name)] > 0 ? <p className="mt-1 text-[var(--muted)]">{helperLabel(counts[utilitySlug(item.name)])}</p> : null}
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)]">
                  <Link href={`/use/${utilitySlug(item.name)}`} className={actionClass}>I can help</Link>
                  <Link href={startUtilityPath(item)} className={actionClass}>Start this</Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
