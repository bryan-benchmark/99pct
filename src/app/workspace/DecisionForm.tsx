"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { decisionQuestions, type DecisionContent, type DecisionLenses } from "@/workspace/decisions";

export function DecisionForm({ orgId, contractRevision, decisionId, expectedRevision, initial }: { orgId: string; contractRevision: number; decisionId?: string; expectedRevision?: number; initial?: DecisionContent }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const status = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-status") === "submitted" ? "submitted" : "draft";
    const lenses = Object.fromEntries(Object.keys(decisionQuestions).map((key) => [key, String(data.get(key) || "")])) as DecisionLenses;
    const content = { title: String(data.get("title") || ""), action: String(data.get("action") || ""), lenses, evidenceReferences: String(data.get("evidenceReferences") || "").split("\n").map((line) => line.trim()).filter(Boolean) };
    setBusy(true); setError(""); setMessage("");
    try {
      const csrfResponse = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(decisionId ? `/api/workspace/organizations/${orgId}/decisions/${decisionId}/revisions` : `/api/workspace/organizations/${orgId}/decisions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, contractRevision, expectedRevision, status, content }),
      });
      const result = await response.json() as { error?: string; decision?: { id: string } };
      if (!response.ok || !result.decision) throw new Error(result.error || "Could not save the decision.");
      if (!decisionId) router.push(`/workspace/organizations/${orgId}/decisions/${result.decision.id}`);
      else { setMessage(status === "submitted" ? "Decision revision submitted." : "Decision draft saved."); router.refresh(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the decision."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-4 font-[family-name:var(--font-sans)] text-sm">
    <p>Operating decision tied to submitted Mission Contract revision {contractRevision}. Drafts may be partial; submission needs every lens. Human review remains required.</p>
    <label className="block">Decision title<input name="title" required maxLength={160} defaultValue={initial?.title || ""} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    <label className="block">Proposed action<textarea name="action" maxLength={2000} rows={3} defaultValue={initial?.action || ""} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    {(Object.entries(decisionQuestions) as [keyof DecisionLenses, string][]).map(([key, question]) => <label className="block" key={key}>{question}<textarea name={key} maxLength={1500} rows={2} defaultValue={initial?.lenses[key] || ""} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>)}
    <label className="block">Evidence links, one HTTP or HTTPS URL per line<textarea name="evidenceReferences" rows={3} defaultValue={initial?.evidenceReferences.join("\n") || ""} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}{message ? <p role="status">{message}</p> : null}
    <div className="flex gap-3"><button type="submit" data-status="draft" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button><button type="submit" data-status="submitted" disabled={busy} className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-white disabled:opacity-50">Submit for review</button></div>
  </form>;
}
