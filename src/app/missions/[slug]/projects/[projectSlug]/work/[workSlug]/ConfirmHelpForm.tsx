"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { workCopy } from "@/missions/model";

export function ConfirmHelpForm({ missionSlug, projectSlug, workSlug }: { missionSlug: string; projectSlug: string; workSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}/participation/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, confirm: true }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "helping") throw new Error(body.error || "Could not confirm help.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm help.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 font-[family-name:var(--font-sans)] text-sm">
      <p>{workCopy.confirmBoundary}</p>
      <button type="button" onClick={confirm} disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Sending…" : workCopy.illHelp}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </div>
  );
}
