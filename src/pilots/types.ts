export const economicModes = {
  market: "Market — users cover costs and may create surplus",
  utility: "Utility — aim to cover costs",
  subsidized: "Subsidized — named supporters cover the gap",
  publicGood: "Public good — users are not expected to pay",
} as const;

export type EconomicMode = keyof typeof economicModes;

export type PilotDraft = {
  scope: string;
  steward: string;
  endDate: string;
  economicMode: EconomicMode;
  fundingSource: string;
  resourceLimit: string;
  successMeasure: string;
  humanGuardrail: string;
  safetyGuardrail: string;
  participantNotice: string;
  stopRule: string;
};

export type PilotPlan = PilotDraft & {
  id: string;
  sparkId: string;
  createdAt: string;
  status: "candidate_for_review";
};

const textLimits: Record<Exclude<keyof PilotDraft, "endDate" | "economicMode">, number> = {
  scope: 500,
  steward: 160,
  fundingSource: 240,
  resourceLimit: 160,
  successMeasure: 400,
  humanGuardrail: 400,
  safetyGuardrail: 400,
  participantNotice: 400,
  stopRule: 400,
};

export function parsePilotDraft(value: unknown, today = new Date().toISOString().slice(0, 10)): PilotDraft {
  if (typeof value !== "object" || value === null) {
    throw new Error("Complete the pilot plan before saving it.");
  }
  const record = value as Record<string, unknown>;
  const fields = {} as Pick<PilotDraft, keyof typeof textLimits>;
  for (const key of Object.keys(textLimits) as (keyof typeof textLimits)[]) {
    const raw = record[key];
    if (typeof raw !== "string" || !raw.trim() || raw.trim().length > textLimits[key]) {
      throw new Error(`Enter ${key} using ${textLimits[key]} characters or fewer.`);
    }
    fields[key] = raw.trim();
  }
  const endDate = record.endDate;
  if (typeof endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(Date.parse(`${endDate}T00:00:00Z`)) || new Date(`${endDate}T00:00:00Z`).toISOString().slice(0, 10) !== endDate || endDate <= today) {
    throw new Error("Choose an end date after today.");
  }
  const economicMode = record.economicMode;
  if (typeof economicMode !== "string" || !(economicMode in economicModes)) {
    throw new Error("Choose an economic mode.");
  }
  return { ...fields, endDate, economicMode: economicMode as EconomicMode };
}
