"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
    await fetch("/api/human/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });
    router.push("/missions");
    router.refresh();
  }

  return <button type="button" onClick={signOut} disabled={busy} className="mt-8 font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">Sign out</button>;
}
