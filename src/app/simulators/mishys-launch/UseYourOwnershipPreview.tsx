"use client";

import { useState } from "react";

/**
 * Future capability attached to ownership — concept only.
 * No valuation, underwriting, or mocked dollar amounts.
 * See docs/proposals/MISHYS_OWNERSHIP_LIQUIDITY.md
 */

export function UseYourOwnershipPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-dashed border-[var(--line)] px-4 py-4 opacity-90">
      <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Future capability
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex w-full items-baseline justify-between gap-3 text-left"
      >
        <span className="text-lg font-semibold text-[var(--ink)]">
          Use your ownership
        </span>
        <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
          {open ? "Hide" : "Learn more"}
        </span>
      </button>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Your ownership may eventually help you access capital without requiring
        you to sell it.
      </p>

      {open ? (
        <div className="mt-5 space-y-4 border-t border-[var(--line)] pt-4 text-sm text-[var(--body)]">
          <p>
            Keep your ownership while accessing capital for things like:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Home</li>
            <li>Education</li>
            <li>Major life purchases</li>
            <li>Starting another mission</li>
            <li>Emergency liquidity</li>
          </ul>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Financing would come from independent capital partners and would be
            subject to their valuation and underwriting.
          </p>
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Future capability
          </p>
        </div>
      ) : null}
    </div>
  );
}
