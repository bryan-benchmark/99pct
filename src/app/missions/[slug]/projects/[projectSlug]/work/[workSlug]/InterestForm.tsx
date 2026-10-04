"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { workCopy } from "@/missions/model";

export function InterestForm({ missionSlug, projectSlug, workSlug }: { missionSlug: string; projectSlug: string; workSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          note: data.get("note") ?? "",
          shareEmail: data.get("shareEmail") === "yes",
        }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "interested") throw new Error(body.error || "Could not send interest.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send interest.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-4 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <p>{workCopy.interestBoundary}</p>
      <label className="block">{workCopy.notePrompt}<textarea name="note" maxLength={500} className={field} /></label>
      <label className="block"><input name="shareEmail" type="checkbox" value="yes" required className="mr-2" />{workCopy.consent}</label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Sending…" : "Send interest"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
