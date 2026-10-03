"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") || "");
    setBusy(true);
    setError("");
    try {
      const csrfResponse = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch("/api/workspace/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, csrfToken }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not create organization.");
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create organization.");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={create} className="space-y-3 font-[family-name:var(--font-sans)] text-sm">
    <label className="block">Organization name<input name="name" required minLength={2} maxLength={160} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Creating…" : "Create organization"}</button>
  </form>;
}
