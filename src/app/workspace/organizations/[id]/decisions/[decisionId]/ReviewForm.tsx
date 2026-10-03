"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { reviewGateQuestions, type ReviewGateKey } from "@/workspace/review-gates";

export function ReviewForm({ orgId, decisionId, revision }: { orgId: string; decisionId: string; revision: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gateStatuses, setGateStatuses] = useState<Partial<Record<ReviewGateKey, string>>>({});
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const disposition = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-disposition") === "approved" ? "approved" : "rejected";
    const gates = Object.fromEntries((Object.keys(reviewGateQuestions) as ReviewGateKey[]).map((key) => [key, {
      status: String(data.get(`gate_${key}_status`) || ""),
      note: String(data.get(`gate_${key}_note`) || ""),
    }]));
    setBusy(true); setError("");
    try {
      const csrfResponse = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/workspace/organizations/${orgId}/decisions/${decisionId}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, revision, disposition, reason: String(data.get("reason") || ""), gates }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not record review.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not record review."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={review} className="space-y-4 font-[family-name:var(--font-sans)] text-sm">
    <p>Reviewing submitted revision {revision}. Your decision, gate assessments, and reason become permanent history. These are your assessments, not a legal or protocol certification.</p>
    <fieldset className="space-y-3"><legend className="font-semibold">Hard-gate assessment</legend><p>Assess each possible blocker. Approval requires all seven marked “No blocker identified.” Reject if a blocker is present or unresolved.</p>
      {(Object.entries(reviewGateQuestions) as [ReviewGateKey, string][]).map(([key, question]) => <div key={key} className="border border-[var(--line)] p-3">
        <label className="block font-semibold">{question}<select name={`gate_${key}_status`} required defaultValue="" onChange={(event) => setGateStatuses((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full border border-[var(--line)] bg-white p-2"><option value="" disabled>Choose assessment</option><option value="clear">No blocker identified</option><option value="unresolved">Unresolved</option><option value="triggered">Blocker identified</option></select></label>
        <label className="mt-2 block">Notes for: {question} {gateStatuses[key] === "unresolved" || gateStatuses[key] === "triggered" ? "(required)" : "(optional)"}<textarea name={`gate_${key}_note`} required={gateStatuses[key] === "unresolved" || gateStatuses[key] === "triggered"} maxLength={500} rows={2} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
      </div>)}
    </fieldset>
    <label className="block">Review reason<textarea name="reason" required maxLength={2000} rows={3} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    <div className="flex gap-3"><button type="submit" data-disposition="approved" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">Approve</button><button type="submit" data-disposition="rejected" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">Reject</button></div>
  </form>;
}
