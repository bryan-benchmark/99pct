"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function PostWorkForm({ missionSlug, projectSlug }: { missionSlug: string; projectSlug: string }) {
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
      const response = await fetch(`/api/missions/${missionSlug}/projects/${projectSlug}/work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          kind: data.get("kind"),
          title: data.get("title"),
          description: data.get("description"),
          doneWhen: data.get("doneWhen"),
        }),
      });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Could not post the work.");
      router.push(body.url);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post the work.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <fieldset>
        <legend>Type</legend>
        <label className="mr-4"><input type="radio" name="kind" value="task" required defaultChecked /> Task</label>
        <label><input type="radio" name="kind" value="role" /> Role</label>
        <p className="mt-1 text-[var(--muted)]">A Task is a bounded thing. A Role is an ongoing responsibility.</p>
      </fieldset>
      <label className="block">Title<input name="title" required minLength={2} maxLength={80} placeholder="Plain name for the work." className={field} /></label>
      <label className="block">What needs doing<textarea name="description" required minLength={8} maxLength={500} className={field} /></label>
      <label className="block">Done when<input name="doneWhen" required minLength={8} maxLength={240} className={field} /></label>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Posting…" : "Post needed Work"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
