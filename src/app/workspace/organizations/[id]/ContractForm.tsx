"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { contractQuestions, type ContractAnswers } from "@/workspace/contracts";

export function ContractForm({ orgId, revision, answers }: { orgId: string; revision: number; answers?: ContractAnswers }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitted = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-status") === "submitted";
    const data = new FormData(form);
    const nextAnswers = Object.fromEntries(Object.keys(contractQuestions).map((key) => [key, String(data.get(key) || "")])) as ContractAnswers;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const csrfResponse = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/workspace/organizations/${orgId}/contract`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, expectedRevision: revision, status: submitted ? "submitted" : "draft", answers: nextAnswers }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save the Mission Contract.");
      setMessage(submitted ? "Mission Contract submitted." : "Draft saved.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the Mission Contract.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="space-y-5 font-[family-name:var(--font-sans)] text-sm">
    <p>Save a partial draft, then answer all seven questions before submitting. Every save creates a permanent revision.</p>
    {(Object.entries(contractQuestions) as [keyof ContractAnswers, string][]).map(([key, question]) =>
      <label className="block" key={key}>{question}<textarea name={key} maxLength={1000} defaultValue={answers?.[key] || ""} rows={3} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    )}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {message ? <p role="status">{message}</p> : null}
    <div className="flex gap-3">
      <button type="submit" data-status="draft" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button>
      <button type="submit" data-status="submitted" disabled={busy} className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-white disabled:opacity-50">Submit contract</button>
    </div>
  </form>;
}
