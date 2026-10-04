export const exposureClasses = {
  interface_only: "Interface only",
  operational: "Operational practice",
  protocol_candidate: "Protocol change candidate",
} as const;

export type ExposureClass = keyof typeof exposureClasses;
export type ExperimentDraft = {
  hypothesis: string;
  intervention: string;
  comparison: string;
  exposureClass: ExposureClass;
  primaryOutcome: string;
  humanGuardrail: string;
  consentPlan: string;
  stopRule: string;
  evidencePlan: string;
  endDate: string;
  adoptionRule: string;
};
export type ExperimentProposal = ExperimentDraft & {
  id: string;
  missionId: "toolshare-demo";
  createdAt: string;
  status: "proposed_for_review";
};

const limits = {
  hypothesis: 400,
  intervention: 400,
  comparison: 400,
  primaryOutcome: 300,
  humanGuardrail: 400,
  consentPlan: 400,
  stopRule: 400,
  evidencePlan: 400,
  adoptionRule: 400,
} as const;

export function parseExperimentDraft(value: unknown, today = new Date().toISOString().slice(0, 10)): ExperimentDraft {
  if (typeof value !== "object" || value === null) throw new Error("Complete the experiment proposal.");
  const record = value as Record<string, unknown>;
  const fields = {} as Pick<ExperimentDraft, keyof typeof limits>;
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    const raw = record[key];
    if (typeof raw !== "string" || !raw.trim() || raw.trim().length > limits[key]) throw new Error(`Enter ${key} using ${limits[key]} characters or fewer.`);
    fields[key] = raw.trim();
  }
  const exposureClass = record.exposureClass;
  if (typeof exposureClass !== "string" || !(exposureClass in exposureClasses)) throw new Error("Choose an exposure class.");
  const endDate = record.endDate;
  if (typeof endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(Date.parse(`${endDate}T00:00:00Z`)) || new Date(`${endDate}T00:00:00Z`).toISOString().slice(0, 10) !== endDate || endDate <= today) throw new Error("Choose an end date after today.");
  return { ...fields, exposureClass: exposureClass as ExposureClass, endDate };
}
