"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateProjectForm({ missionSlug }: { missionSlug: string }) {
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
      const response = await fetch(`/api/missions/${missionSlug}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          title: data.get("title"),
          outcome: data.get("outcome"),
        }),
      });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Could not create the Project.");
      router.push(body.url);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the Project.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <label className="block">What are we calling this Project?<input name="title" required minLength={2} maxLength={80} className={field} /></label>
      <label className="block">What should be true when this Project is done?<textarea name="outcome" required minLength={8} maxLength={500} className={field} /></label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Creating…" : "Create Project"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
