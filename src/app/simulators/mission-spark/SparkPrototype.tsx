"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inputOptions, needLabels, type SparkDraft, type SparkInput } from "@/sparks/types";

const emptyDraft: SparkDraft = {
  wish: "",
  name: "",
  people: "",
  place: "",
  pilot: "",
  evidence: "",
  inputs: [],
};

const fieldClass =
  "mt-1 block w-full border border-[var(--line)] bg-white px-3 py-2 font-[family-name:var(--font-sans)] text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ink)]";

export function SparkPrototype() {
  const router = useRouter();
  const [draft, setDraft] = useState<SparkDraft>(emptyDraft);
  const [stage, setStage] = useState<"wish" | "details" | "preview">("wish");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function update<K extends keyof SparkDraft>(key: K, value: SparkDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleInput(input: SparkInput) {
    setDraft((current) => ({
      ...current,
      inputs: current.inputs.includes(input)
        ? current.inputs.filter((item) => item !== input)
        : [...current.inputs, input],
    }));
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStage(stage === "wish" ? "details" : "preview");
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/sparks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not save proposal.");
      router.push(result.url);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save proposal.");
      setSaving(false);
    }
  }

  if (stage === "preview") {
    return (
      <div className="space-y-5" aria-live="polite">
        <div className="border border-[var(--line)] p-5">
          <p className="font-[family-name:var(--font-sans)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Draft Spark · local preview
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            {draft.name.trim()}
          </h3>
          <p className="mt-3 text-lg">{draft.wish.trim()}</p>
          <dl className="mt-5 space-y-3 text-base">
            <div><dt className="font-semibold">For</dt><dd>{draft.people.trim()}</dd></div>
            <div><dt className="font-semibold">Where</dt><dd>{draft.place.trim()}</dd></div>
            <div><dt className="font-semibold">First pilot</dt><dd>{draft.pilot.trim()}</dd></div>
            <div><dt className="font-semibold">Evidence it works</dt><dd>{draft.evidence.trim()}</dd></div>
            <div>
              <dt className="font-semibold">Help needed</dt>
              <dd>{draft.inputs.length ? draft.inputs.map((item) => needLabels[item]).join(" · ") : "Still to decide"}</dd>
            </div>
          </dl>
        </div>
        <p className="text-sm text-[var(--muted)]">
          This draft is based only on your answers. No AI research, demand
          validation, or feasibility check has run.
        </p>
        <p className="text-sm text-[var(--muted)]">
          Saving gives this proposal a link visible to anyone who has it. Avoid
          personal or confidential details. This local prototype cannot collect
          payments or create binding commitments.
        </p>
        {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
        <div className="flex flex-wrap gap-3 font-[family-name:var(--font-sans)] text-sm">
          <button type="button" className="border border-[var(--ink)] px-4 py-2" onClick={() => setStage("details")}>Edit proposal</button>
          <button type="button" disabled={saving} className="bg-[var(--ink)] px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={save}>{saving ? "Saving..." : "Save proposal"}</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={advance} className="space-y-5 font-[family-name:var(--font-sans)] text-base">
      <label className="block font-semibold" htmlFor="spark-wish">
        What should exist?
        <textarea
          id="spark-wish"
          required
          maxLength={500}
          rows={3}
          placeholder="I wish my neighborhood had a place to borrow tools..."
          className={fieldClass}
          value={draft.wish}
          onChange={(event) => update("wish", event.target.value)}
        />
      </label>
      {stage === "details" ? (
        <>
          <label className="block font-semibold" htmlFor="spark-name">
            What would you call this idea?
            <input id="spark-name" required maxLength={80} className={fieldClass} value={draft.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <label className="block font-semibold" htmlFor="spark-people">
            Who would benefit?
            <input id="spark-people" required maxLength={160} className={fieldClass} placeholder="Households that rarely need to own a drill" value={draft.people} onChange={(event) => update("people", event.target.value)} />
          </label>
          <label className="block font-semibold" htmlFor="spark-place">
            Where would you try it first?
            <input id="spark-place" required maxLength={120} className={fieldClass} placeholder="Decatur, Georgia" value={draft.place} onChange={(event) => update("place", event.target.value)} />
          </label>
          <label className="block font-semibold" htmlFor="spark-pilot">
            What is the smallest useful pilot?
            <textarea id="spark-pilot" required maxLength={400} rows={2} className={fieldClass} placeholder="Let 20 nearby households borrow five shared tools for one month" value={draft.pilot} onChange={(event) => update("pilot", event.target.value)} />
          </label>
          <label className="block font-semibold" htmlFor="spark-evidence">
            What would show it helped?
            <textarea id="spark-evidence" required maxLength={400} rows={2} className={fieldClass} placeholder="At least 15 loans, with returns on time and costs covered" value={draft.evidence} onChange={(event) => update("evidence", event.target.value)} />
          </label>
          <fieldset>
            <legend className="font-semibold">What might the pilot need?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {inputOptions.map((input) => (
                <label key={input} className="flex items-start gap-2 border border-[var(--line)] px-3 py-2">
                  <input type="checkbox" className="mt-1" checked={draft.inputs.includes(input)} onChange={() => toggleInput(input)} />
                  <span>{needLabels[input]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {stage === "details" ? <button type="button" className="border border-[var(--line)] px-4 py-2" onClick={() => setStage("wish")}>Back</button> : null}
        <button type="submit" className="bg-[var(--ink)] px-4 py-2 font-semibold text-white">{stage === "wish" ? "Shape this idea" : "Preview proposal"}</button>
      </div>
    </form>
  );
}
