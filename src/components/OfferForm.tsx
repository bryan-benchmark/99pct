"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function OfferForm({ slug, pieces, selected, own }: { slug: string; pieces: string[]; selected: string; own: { piece: string; note: string } | null }) {
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
          piece: data.get("piece"),
          note: data.get("note") ?? "",
          shareEmail: data.get("shareEmail") === "yes",
        }),
      });
      const body = await response.json() as { status?: string; error?: string; next?: string };
      if (!response.ok || body.status !== "offered") throw new Error(body.error || "Could not save that.");
      if (body.next?.startsWith("/") && !body.next.startsWith("//")) router.push(body.next);
      else router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  const chosen = pieces.includes(selected) ? selected : "";
  const rest = pieces.filter((piece) => piece !== chosen);
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 font-[family-name:var(--font-sans)] text-sm">
      <fieldset>
        <legend className="font-semibold text-[var(--ink)]">{chosen ? "This piece" : "Which piece"}</legend>
        <div className="mt-3 space-y-2">
          {chosen ? (
            <label className="block text-base text-[var(--ink)]">
              <input type="radio" name="piece" value={chosen} required defaultChecked className="mr-2" />
              {chosen}
            </label>
          ) : null}
          {chosen ? (rest.length > 0 ? (
            <details>
              <summary className="min-h-11 cursor-pointer py-2">A different piece</summary>
              {rest.map((piece) => (
                <label key={piece} className="mt-2 block">
                  <input type="radio" name="piece" value={piece} className="mr-2" />
                  {piece}
                </label>
              ))}
            </details>
          ) : null) : pieces.map((piece) => (
            <label key={piece} className="block">
              <input type="radio" name="piece" value={piece} required defaultChecked={own?.piece === piece} className="mr-2" />
              {piece}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">Anything people should know?<textarea name="note" maxLength={240} defaultValue={own?.note ?? ""} className={field} /></label>
      {chosen === "Look after the list" || (!chosen && pieces.includes("Look after the list")) ? <p>Choosing Look after the list starts this utility. You will see the email of people who asked to help.</p> : null}
      <label className="block"><input name="shareEmail" type="checkbox" value="yes" required className="mr-2" />Share my verified email with the person who looks after this utility.</label>
      <p>Raising your hand is not a job, a paycheck, or ownership.</p>
      <button type="submit" disabled={busy} className="w-full border border-[var(--ink)] px-4 py-2 disabled:opacity-50 sm:w-auto">{busy ? "Saving…" : own ? "Update how you can help" : "I can do this"}</button>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </form>
  );
}
