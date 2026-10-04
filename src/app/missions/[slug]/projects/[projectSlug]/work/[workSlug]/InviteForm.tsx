"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { workCopy } from "@/missions/model";

export function InviteForm({ missionSlug, projectSlug, workSlug, interestId }: { missionSlug: string; projectSlug: string; workSlug: string; interestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function invite() {
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}/interests/${interestId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "invited") throw new Error(body.error || "Could not send the invitation.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={invite} disabled={busy} className="border border-[var(--ink)] px-4 py-2 font-[family-name:var(--font-sans)] text-sm disabled:opacity-50">{busy ? "Sending…" : workCopy.inviteToHelp}</button>
      {error ? <p role="alert" className="mt-3 border border-red-700 p-3 text-red-700">{error}</p> : null}
    </div>
  );
}
