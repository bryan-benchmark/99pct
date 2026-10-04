"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function StartMissionForm() {
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
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          name: data.get("name"),
          purpose: data.get("purpose"),
          beneficiaries: data.get("beneficiaries"),
          startingPlace: data.get("startingPlace"),
        }),
      });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Could not start the Mission.");
      router.push(body.url);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the Mission.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <label className="block">Name<input name="name" required minLength={2} maxLength={80} className={field} /></label>
      <label className="block">Purpose<input name="purpose" required minLength={8} maxLength={500} className={field} /></label>
      <label className="block">For<input name="beneficiaries" required minLength={2} maxLength={160} className={field} /></label>
      <label className="block">Starts in<input name="startingPlace" required minLength={2} maxLength={80} placeholder="A place, community, or Global" className={field} /></label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Starting…" : "Start Mission"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
