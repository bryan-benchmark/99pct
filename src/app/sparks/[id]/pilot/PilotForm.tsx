"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { economicModes, type EconomicMode, type PilotDraft } from "@/pilots/types";

const fieldClass = "mt-1 block w-full border border-[var(--line)] bg-white px-3 py-2 font-[family-name:var(--font-sans)] text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ink)]";

export function PilotForm({ sparkId, pilot, evidence }: { sparkId: string; pilot: string; evidence: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<PilotDraft>({
    scope: pilot,
    steward: "",
    endDate: "",
    economicMode: "utility",
    fundingSource: "",
    resourceLimit: "",
    successMeasure: evidence,
    humanGuardrail: "",
    safetyGuardrail: "",
    participantNotice: "",
    stopRule: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof PilotDraft>(key: K, value: PilotDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/sparks/${sparkId}/pilots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not save the plan.");
      router.push(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the plan.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7 font-[family-name:var(--font-sans)] text-base">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">1. Bound the test</legend>
        <label className="block font-semibold" htmlFor="pilot-scope">What exactly will happen?
          <textarea id="pilot-scope" required maxLength={500} rows={3} className={fieldClass} value={draft.scope} onChange={(event) => update("scope", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-steward">Which role or team would be responsible? <span className="font-normal">(unverified)</span>
          <input id="pilot-steward" required maxLength={160} className={fieldClass} value={draft.steward} onChange={(event) => update("steward", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-end">When would the test end?
          <input id="pilot-end" type="text" inputMode="numeric" pattern="\d{4}-\d{2}-\d{2}" maxLength={10} required placeholder="YYYY-MM-DD" className={fieldClass} value={draft.endDate} onChange={(event) => update("endDate", event.target.value)} />
        </label>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">2. Explain the resources</legend>
        <label className="block font-semibold" htmlFor="pilot-mode">Economic mode
          <select id="pilot-mode" className={fieldClass} value={draft.economicMode} onChange={(event) => update("economicMode", event.target.value as EconomicMode)}>
            {(Object.keys(economicModes) as EconomicMode[]).map((mode) => <option key={mode} value={mode}>{economicModes[mode]}</option>)}
          </select>
        </label>
        <label className="block font-semibold" htmlFor="pilot-funding">Who or what could fund the pilot?
          <input id="pilot-funding" required maxLength={240} className={fieldClass} placeholder="Members, an existing Mission, a grant..." value={draft.fundingSource} onChange={(event) => update("fundingSource", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-limit">What is the spending or resource limit?
          <input id="pilot-limit" required maxLength={160} className={fieldClass} placeholder="For example, up to $500 and 20 volunteer hours" value={draft.resourceLimit} onChange={(event) => update("resourceLimit", event.target.value)} />
        </label>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">3. Define success and protection</legend>
        <label className="block font-semibold" htmlFor="pilot-success">What observable result would count as success?
          <textarea id="pilot-success" required maxLength={400} rows={2} className={fieldClass} value={draft.successMeasure} onChange={(event) => update("successMeasure", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-human">What human experience must not get worse?
          <textarea id="pilot-human" required maxLength={400} rows={2} className={fieldClass} placeholder="Time burden, autonomy, privacy, access, fairness..." value={draft.humanGuardrail} onChange={(event) => update("humanGuardrail", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-safety">What safety or environmental harm must be prevented?
          <textarea id="pilot-safety" required maxLength={400} rows={2} className={fieldClass} value={draft.safetyGuardrail} onChange={(event) => update("safetyGuardrail", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-notice">How would participants be informed and choose whether to take part?
          <textarea id="pilot-notice" required maxLength={400} rows={2} className={fieldClass} value={draft.participantNotice} onChange={(event) => update("participantNotice", event.target.value)} />
        </label>
        <label className="block font-semibold" htmlFor="pilot-stop">What would stop the pilot early?
          <textarea id="pilot-stop" required maxLength={400} rows={2} className={fieldClass} value={draft.stopRule} onChange={(event) => update("stopRule", event.target.value)} />
        </label>
      </fieldset>
      <p className="text-sm text-[var(--muted)]">This form checks whether the plan is complete. It cannot verify consent, safety, funding, or the proposed steward.</p>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={saving} className="bg-[var(--ink)] px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save candidate plan"}</button>
    </form>
  );
}
