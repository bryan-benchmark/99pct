"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { exposureClasses, type ExperimentDraft, type ExposureClass } from "@/experiments/types";

const initial: ExperimentDraft = {
  hypothesis: "A clearer issue-report prompt will reduce incomplete safety reports for demo tools.",
  intervention: "Show a short checklist before submitting a tool issue report.",
  comparison: "Compare with the current issue-report prompt using a supervised, opt-in usability test.",
  exposureClass: "interface_only",
  primaryOutcome: "Share of reports with enough detail for a steward to triage, measured against a pre-set rubric.",
  humanGuardrail: "No participant loses access to a safety warning or a way to report an urgent problem.",
  consentPlan: "Recruit consenting test participants and explain what task data is recorded; do not use real borrower records.",
  stopRule: "Stop if the checklist delays urgent reporting or causes participants to omit safety concerns.",
  evidencePlan: "Record the rubric, sample size, completed task observations, failures, and limitations before review.",
  endDate: "",
  adoptionRule: "A steward reviews evidence and limitations; adoption is a separate human decision for the local Mission.",
};

const fields: { key: keyof ExperimentDraft; label: string; max: number }[] = [
  { key: "hypothesis", label: "Hypothesis", max: 400 },
  { key: "intervention", label: "What changes", max: 400 },
  { key: "comparison", label: "Comparison or baseline", max: 400 },
  { key: "primaryOutcome", label: "Primary outcome", max: 300 },
  { key: "humanGuardrail", label: "Human guardrail", max: 400 },
  { key: "consentPlan", label: "Participant notice and consent", max: 400 },
  { key: "stopRule", label: "Early stop rule", max: 400 },
  { key: "evidencePlan", label: "Evidence to collect", max: 400 },
  { key: "adoptionRule", label: "Who decides whether to adopt", max: 400 },
];

export function ExperimentForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<ExperimentDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const endDate = new FormData(event.currentTarget).get("endDate");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, endDate }) });
      const result = await response.json() as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not save the proposal.");
      router.push(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the proposal.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="space-y-5 font-[family-name:var(--font-sans)] text-sm">
    {fields.map(({ key, label, max }) => <label key={key} className="block font-medium">{label}
      <textarea required maxLength={max} rows={2} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full border border-[var(--line)] bg-white p-2 font-normal" />
    </label>)}
    <label className="block font-medium">Exposure class
      <select value={draft.exposureClass} onChange={(event) => setDraft({ ...draft, exposureClass: event.target.value as ExposureClass })} className="mt-1 block w-full border border-[var(--line)] bg-white p-2 font-normal">
        {(Object.keys(exposureClasses) as ExposureClass[]).map((key) => <option key={key} value={key}>{exposureClasses[key]}</option>)}
      </select>
    </label>
    <label className="block font-medium">Review end date
      <input required name="endDate" type="date" className="mt-1 block border border-[var(--line)] bg-white p-2 font-normal" />
    </label>
    <p>Saving records a proposed design. Human review is required before exposure. A protocol candidate also needs separate governance review; this form cannot alter the canonical specification.</p>
    {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Saving…" : "Save experiment proposal"}</button>
  </form>;
}
