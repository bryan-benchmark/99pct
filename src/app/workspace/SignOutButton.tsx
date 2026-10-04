"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const csrf = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrf.ok) throw new Error("Could not start sign-out.");
      const { csrfToken } = await csrf.json() as { csrfToken: string };
      const response = await fetch("/api/workspace/session", { method: "DELETE", body: JSON.stringify({ csrfToken }) });
      if (!response.ok) throw new Error("Could not end the session.");
      router.push("/workspace/sign-in");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
      setBusy(false);
    }
  }
  return <div className="space-y-2 font-[family-name:var(--font-sans)] text-sm">
    <button type="button" disabled={busy} onClick={signOut} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Signing out…" : "Sign out"}</button>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
  </div>;
}
