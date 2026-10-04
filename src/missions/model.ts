export const missionLimits = {
  name: { min: 2, max: 80 },
  purpose: { min: 8, max: 500 },
  beneficiaries: { min: 2, max: 160 },
  startingPlace: { min: 2, max: 80 },
} as const;

export const missionEmptyStates = {
  projects: "No projects or open work yet.",
  contribution: "No contributions or MCUs have been recorded yet.",
  ownership: "No legal ownership has been issued or linked.",
  governance: "No governance rules have been published yet.",
} as const;

export type MissionDraft = {
  name: string;
  purpose: string;
  beneficiaries: string;
  startingPlace: string;
};

export type PublicMission = {
  slug: string;
  status: "forming";
  name: string;
  purpose: string;
  beneficiaries: string;
  startingPlace: string;
  createdAt: string;
};

export class MissionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionInputError";
  }
}

function field(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string") throw new MissionInputError(`${label} is required.`);
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < min || trimmed.length > max) throw new MissionInputError(`${label} must be ${min}–${max} characters.`);
  return trimmed;
}

export function missionDraft(input: Record<string, unknown>): MissionDraft {
  return {
    name: field(input.name, "Name", missionLimits.name.min, missionLimits.name.max),
    purpose: field(input.purpose, "Purpose", missionLimits.purpose.min, missionLimits.purpose.max),
    beneficiaries: field(input.beneficiaries, "For", missionLimits.beneficiaries.min, missionLimits.beneficiaries.max),
    startingPlace: field(input.startingPlace, "Starts in", missionLimits.startingPlace.min, missionLimits.startingPlace.max),
  };
}

export function missionSlugBase(name: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/g, "");
  return base || "mission";
}

export function publicMissionUrl(slug: string) {
  return `/missions/${slug}`;
}
