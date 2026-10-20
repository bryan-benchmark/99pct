"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { helpKinds, type HelpKind } from "@/content/utilities";

export function OfferForm({ slug, own }: { slug: string; own: { kind: HelpKind; note: string } | null }) {
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
      const response = await fetch(`/api/utilities/${slug}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken,
          kind: data.get("kind"),
          note: data.get("note") ?? "",
          shareEmail: data.get("shareEmail") === "yes",
        }),
      });
      const body = await response.json() as { status?: string; error?: string };
      if (!response.ok || body.status !== "offered") throw new Error(body.error || "Could not save that.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <fieldset>
        <legend className="font-semibold text-[var(--ink)]">How you can help</legend>
        <div className="mt-3 space-y-2">
          {helpKinds.map((kind) => (
            <label key={kind.id} className="block">
              <input type="radio" name="kind" value={kind.id} required defaultChecked={own?.kind === kind.id} className="mr-2" />
              {kind.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">Anything the person who starts this should know?<textarea name="note" maxLength={240} defaultValue={own?.note ?? ""} className={field} /></label>
      <label className="block"><input name="shareEmail" type="checkbox" value="yes" required className="mr-2" />Share my verified email with the person who starts this utility.</label>
      <p>Raising your hand is not a job, a paycheck, or ownership.</p>
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Saving…" : own ? "Update how you can help" : "I can help"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
