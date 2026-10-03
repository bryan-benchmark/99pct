"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TeamUpDraft } from "@/teamups/types";

const initial: TeamUpDraft = {
  purpose: "Restore flagged Toolshare equipment safely so members can use it again.",
  toolshareContribution: "Provide the flagged item, its issue category, and an authorized steward for handoff.",
  repairContribution: "Inspect the item, document findings, and propose a repair or retirement decision.",
  deliverable: "A documented inspection and a decision for each item: return to service, repair further, or retire.",
  toolshareAuthority: "Control inventory availability and authorize any return to service.",
  repairAuthority: "Choose inspection methods and recommend repair or retirement; cannot reopen inventory.",
  jointApproval: "Both designated stewards approve scope changes and any paid work before it starts.",
  successMeasure: "Each referred item receives a documented decision within seven days, with no unsafe item reopened.",
  endDate: "",
  resourceLimit: "At most three fictional items and no real expenditure in this demo.",
  settlementPlan: "No payment or MCU issuance in this demo. A real agreement would state each Mission's prospective compensation terms and ledger separately.",
  coordinationPlan: "One handoff record per item and a weekly steward review during the test.",
  stopRule: "Stop immediately if an item cannot be safely handled or a steward withdraws approval.",
};

const fields: { key: keyof TeamUpDraft; label: string; max: number; rows?: number }[] = [
  { key: "purpose", label: "Shared purpose", max: 400 },
  { key: "toolshareContribution", label: "Toolshare contributes", max: 400 },
  { key: "repairContribution", label: "Repair contributes", max: 400 },
  { key: "deliverable", label: "Deliverable", max: 400 },
  { key: "toolshareAuthority", label: "Toolshare decision authority", max: 300 },
  { key: "repairAuthority", label: "Repair decision authority", max: 300 },
  { key: "jointApproval", label: "Decisions requiring both", max: 300 },
  { key: "successMeasure", label: "Success measure", max: 400 },
  { key: "resourceLimit", label: "Resource limit", max: 200 },
  { key: "settlementPlan", label: "Contribution and settlement terms", max: 400, rows: 3 },
  { key: "coordinationPlan", label: "Coordination", max: 300 },
  { key: "stopRule", label: "Early stop rule", max: 300 },
];

export function TeamUpForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<TeamUpDraft>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endDate = new FormData(event.currentTarget).get("endDate");
      const response = await fetch("/api/teamups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, endDate }) });
      const result = await response.json() as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not save the proposal.");
      router.push(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the proposal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 font-[family-name:var(--font-sans)] text-sm">
      {fields.map(({ key, label, max, rows }) => (
        <label key={key} className="block font-medium">{label}
          <textarea required maxLength={max} rows={rows || 2} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full border border-[var(--line)] bg-white p-2 font-normal" />
        </label>
      ))}
      <label className="block font-medium">End date
        <input required name="endDate" type="date" className="mt-1 block border border-[var(--line)] bg-white p-2 font-normal" />
      </label>
      <p>No real Mission has authorized these terms. A named steward for each side, identity, consent, funding, and any legal or ledger terms require separate review.</p>
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Saving…" : "Save candidate proposal"}</button>
    </form>
  );
}
