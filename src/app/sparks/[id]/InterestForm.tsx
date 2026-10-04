"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { inputLabels, inputOptions, type SparkInput } from "@/sparks/types";

export function InterestForm({ id, recorded }: { id: string; recorded: boolean }) {
  const router = useRouter();
  const [inputs, setInputs] = useState<SparkInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function toggle(input: SparkInput) {
    setInputs((current) => current.includes(input)
      ? current.filter((item) => item !== input)
      : [...current, input]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/sparks/${id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not record interest.");
      setSubmitted(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record interest.");
    } finally {
      setSubmitting(false);
    }
  }

  if (recorded || submitted) {
    return <p role="status" className="border border-[var(--line)] p-3">This browser has already expressed interest in this proposal. Thank you.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 font-[family-name:var(--font-sans)] text-base">
      <fieldset>
        <legend className="font-semibold">I might be able to…</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {inputOptions.map((input) => (
            <label key={input} className="flex items-start gap-2 border border-[var(--line)] px-3 py-2">
              <input type="checkbox" checked={inputs.includes(input)} onChange={() => toggle(input)} className="mt-1" />
              <span>{inputLabels[input]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={!inputs.length || submitting} className="bg-[var(--ink)] px-4 py-2 font-semibold text-white disabled:opacity-50">
        {submitting ? "Recording..." : "Record nonbinding interest"}
      </button>
    </form>
  );
}
