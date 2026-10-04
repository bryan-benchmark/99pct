export type TeamUpDraft = {
  purpose: string;
  toolshareContribution: string;
  repairContribution: string;
  deliverable: string;
  toolshareAuthority: string;
  repairAuthority: string;
  jointApproval: string;
  successMeasure: string;
  endDate: string;
  resourceLimit: string;
  settlementPlan: string;
  coordinationPlan: string;
  stopRule: string;
};

export type TeamUpProposal = TeamUpDraft & {
  id: string;
  createdAt: string;
  status: "candidate_for_review";
  missionIds: ["toolshare-demo", "repair-demo"];
};

const limits: Record<Exclude<keyof TeamUpDraft, "endDate">, number> = {
  purpose: 400,
  toolshareContribution: 400,
  repairContribution: 400,
  deliverable: 400,
  toolshareAuthority: 300,
  repairAuthority: 300,
  jointApproval: 300,
  successMeasure: 400,
  resourceLimit: 200,
  settlementPlan: 400,
  coordinationPlan: 300,
  stopRule: 300,
};

export function parseTeamUpDraft(value: unknown, today = new Date().toISOString().slice(0, 10)): TeamUpDraft {
  if (typeof value !== "object" || value === null) throw new Error("Complete the Team-Up proposal.");
  const record = value as Record<string, unknown>;
  const fields = {} as Pick<TeamUpDraft, keyof typeof limits>;
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    const raw = record[key];
    if (typeof raw !== "string" || !raw.trim() || raw.trim().length > limits[key]) {
      throw new Error(`Enter ${key} using ${limits[key]} characters or fewer.`);
    }
    fields[key] = raw.trim();
  }
  const endDate = record.endDate;
  if (typeof endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(Date.parse(`${endDate}T00:00:00Z`)) || new Date(`${endDate}T00:00:00Z`).toISOString().slice(0, 10) !== endDate || endDate <= today) {
    throw new Error("Choose an end date after today.");
  }
  return { ...fields, endDate };
}
