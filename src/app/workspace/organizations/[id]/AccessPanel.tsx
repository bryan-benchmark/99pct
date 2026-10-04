"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { WorkspaceRole } from "@/workspace/access";

type Member = { user_id: string; email: string; role: WorkspaceRole; status: string };
type Invitation = { id: string; email: string; role: "editor" | "reviewer"; expires_at: Date | string };

export function AccessPanel({ orgId, actorId, members, invitations, owner }: { orgId: string; actorId: string; members: Member[]; invitations: Invitation[]; owner: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  async function csrfToken() {
    const response = await fetch("/api/workspace/csrf", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not start a secure request.");
    return (await response.json() as { csrfToken: string }).csrfToken;
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setInviteLink("");
    try {
      const token = await csrfToken();
      const response = await fetch(`/api/workspace/organizations/${orgId}/invitations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken: token, email: String(data.get("email") || ""), role: String(data.get("role") || "") }),
      });
      const result = await response.json() as { error?: string; invitation?: { token: string } };
      if (!response.ok || !result.invitation) throw new Error(result.error || "Could not create invitation.");
      setInviteLink(`${window.location.origin}/workspace/invites/${result.invitation.token}`);
      form.reset();
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create invitation."); }
    finally { setBusy(false); }
  }

  async function revoke(kind: "member" | "invitation", targetId: string) {
    setBusy(true); setError(""); setInviteLink("");
    try {
      const token = await csrfToken();
      const response = await fetch(`/api/workspace/organizations/${orgId}/access`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken: token, kind, targetId }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not revoke access.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke access."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6 font-[family-name:var(--font-sans)] text-sm">
    {owner ? <form onSubmit={invite} className="space-y-3">
      <p>Invite a verified account. Share the one-time link privately; it expires in seven days and only works for the invited email.</p>
      <label className="block">Email<input name="email" type="email" required className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label>
      <label className="block">Role<select name="role" defaultValue="reviewer" className="mt-1 block w-full border border-[var(--line)] bg-white p-2"><option value="reviewer">Reviewer</option><option value="editor">Editor</option></select></label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">Create invitation</button>
      {inviteLink ? <label className="block">Share this link now. It will not be shown again.<input readOnly value={inviteLink} onFocus={(event) => event.currentTarget.select()} className="mt-1 block w-full border border-[var(--line)] bg-white p-2" /></label> : null}
    </form> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    <div><h3 className="font-semibold">Members</h3><ul>{members.map((member) => <li key={member.user_id} className="py-1">{member.email} · {member.role} · {member.status} {owner && member.status === "active" && member.user_id !== actorId && member.role !== "owner" ? <button type="button" disabled={busy} onClick={() => revoke("member", member.user_id)} className="ml-2 underline disabled:opacity-50">Revoke</button> : null}</li>)}</ul></div>
    {owner ? <div><h3 className="font-semibold">Pending invitations</h3>{invitations.length ? <ul>{invitations.map((item) => <li key={item.id} className="py-1">{item.email} · {item.role} · expires {new Date(item.expires_at).toLocaleDateString("en-US", { timeZone: "UTC" })} <button type="button" disabled={busy} onClick={() => revoke("invitation", item.id)} className="ml-2 underline disabled:opacity-50">Revoke</button></li>)}</ul> : <p>None.</p>}</div> : null}
  </div>;
}
