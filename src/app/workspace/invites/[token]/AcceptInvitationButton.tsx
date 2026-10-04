"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setBusy(true); setError("");
    try {
      const csrfResponse = await fetch("/api/workspace/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure request.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`/api/workspace/invitations/${token}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csrfToken }) });
      const result = await response.json() as { error?: string; membership?: { orgId: string } };
      if (!response.ok || !result.membership) throw new Error(result.error || "Could not accept invitation.");
      router.replace(`/workspace/organizations/${result.membership.orgId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not accept invitation."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3"><button type="button" onClick={accept} disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Joining…" : "Accept invitation"}</button>{error ? <p role="alert" className="text-red-700">{error}</p> : null}</div>;
}
