"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { workCopy } from "@/missions/model";

export function RecognizeForm({ missionSlug, projectSlug, workSlug, contributionId }: { missionSlug: string; projectSlug: string; workSlug: string; contributionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function recognize() {
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}/contributions/${contributionId}/recognize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, recognize: true }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "recognized") throw new Error(body.error || "Could not recognize the Contribution.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not recognize the Contribution.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <p className="text-[var(--body)]">{workCopy.recognitionBoundary}</p>
      <button type="button" onClick={recognize} disabled={busy} className="mt-2 border border-[var(--ink)] px-4 py-2 font-[family-name:var(--font-sans)] text-sm disabled:opacity-50">{busy ? "Recognizing…" : workCopy.recognizeContribution}</button>
      {error ? <p role="alert" className="mt-2 border border-red-700 p-3 text-red-700">{error}</p> : null}
    </div>
  );
}
