"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { workCopy } from "@/missions/model";

export function ContributionForm({ missionSlug, projectSlug, workSlug }: { missionSlug: string; projectSlug: string; workSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          summary: data.get("summary") ?? "",
          evidence: data.get("evidence") ?? "",
          idempotencyKey,
        }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "recorded") throw new Error(body.error || "Could not record the Contribution.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record the Contribution.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-4 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <p>{workCopy.contributionBoundary}</p>
      <label className="block">{workCopy.contributionSummary}<textarea name="summary" required maxLength={500} className={field} /></label>
      <label className="block">{workCopy.contributionEvidence}<input name="evidence" maxLength={500} className={field} /></label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Recording…" : workCopy.recordContribution}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
