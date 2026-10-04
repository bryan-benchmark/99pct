"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { issueCodes, type IssueCode, type ToolAction, type ToolshareSnapshot } from "@/toolshare/model";

const statusLabels = {
  available: "Available",
  reserved: "Reserved",
  out: "Checked out",
  needs_review: "Needs review",
} as const;

export function ToolshareDemo({ snapshot }: { snapshot: ToolshareSnapshot }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<IssueCode>("damaged");

  async function act(action: ToolAction, key: string) {
    setBusy(key);
    setError("");
    try {
      const response = await fetch("/api/toolshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Action failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  const buttonClass = "border border-[var(--ink)] px-3 py-1.5 font-[family-name:var(--font-sans)] text-sm disabled:opacity-50";

  return (
    <div className="space-y-5">
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
      {snapshot.inventory.map((tool) => {
        const mine = snapshot.myReservations.find((reservation) => reservation.id === tool.activeReservationId);
        const disabled = Boolean(busy);
        return (
          <article key={tool.id} className="border border-[var(--line)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-[var(--ink)]">{tool.name}</h3>
                <p>{tool.use}</p>
                <p className="text-sm text-[var(--muted)]">{tool.location}</p>
              </div>
              <span className="border border-[var(--line)] px-2 py-1 font-[family-name:var(--font-sans)] text-xs uppercase tracking-wide">{statusLabels[tool.status]}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tool.status === "available" ? (
                <button type="button" disabled={disabled} className={buttonClass} onClick={() => act({ type: "reserve", toolId: tool.id }, tool.id)}>Reserve demo tool</button>
              ) : null}
              {mine?.status === "reserved" ? (
                <>
                  {!mine.issueCode ? <button type="button" disabled={disabled} className={buttonClass} onClick={() => act({ type: "check_out", reservationId: mine.id }, tool.id)}>Check out</button> : null}
                  <button type="button" disabled={disabled} className={buttonClass} onClick={() => act({ type: "cancel", reservationId: mine.id }, tool.id)}>Cancel reservation</button>
                </>
              ) : null}
              {mine?.status === "out" ? (
                <button type="button" disabled={disabled} className={buttonClass} onClick={() => act({ type: "return", reservationId: mine.id }, tool.id)}>Return tool</button>
              ) : null}
            </div>
            {mine && (mine.status === "reserved" || mine.status === "out") && !mine.issueCode ? (
              <div className="mt-4 flex flex-wrap items-end gap-2 font-[family-name:var(--font-sans)] text-sm">
                <label htmlFor={`issue-${tool.id}`} className="block">Report an issue
                  <select id={`issue-${tool.id}`} className="mt-1 block border border-[var(--line)] bg-white px-2 py-1" value={selectedIssue} onChange={(event) => setSelectedIssue(event.target.value as IssueCode)}>
                    {(Object.keys(issueCodes) as IssueCode[]).map((code) => <option key={code} value={code}>{issueCodes[code]}</option>)}
                  </select>
                </label>
                <button type="button" disabled={disabled} className={buttonClass} onClick={() => act({ type: "report_issue", reservationId: mine.id, issueCode: selectedIssue }, tool.id)}>Flag tool</button>
              </div>
            ) : null}
            {mine?.issueCode ? <p className="mt-3 text-sm">Issue reported: {issueCodes[mine.issueCode]}. This tool stays unavailable for review.</p> : null}
          </article>
        );
      })}
    </div>
  );
}
