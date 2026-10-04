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

export const projectLimits = {
  title: { min: 2, max: 80 },
  outcome: { min: 8, max: 500 },
} as const;

export const workLimits = {
  title: { min: 2, max: 80 },
  description: { min: 8, max: 500 },
  doneWhen: { min: 8, max: 240 },
} as const;

export const projectCopy = {
  framing: "A Project is a bounded outcome this Mission needs.",
  emptyWork: "No open work has been posted yet.",
  workBoundary: "Open work is a request for help. It is not yet a job offer, contract, promise of pay, MCU grant, or ownership grant.",
} as const;

export const workCopy = {
  postingBoundary: "Posting this does not create a contract, compensation, MCUs, or ownership. Join and agreement flows come next.",
  wantToHelp: "I want to help",
  interestSent: "Interest sent",
  interestSentDetail: "The Mission creator can now see your verified email and private note.",
  interestBoundary: "This only expresses interest. It does not create a job, contract, assignment, compensation, MCUs, or ownership.",
  consent: "Share my verified email with this Mission's creator so they can follow up.",
  notePrompt: "Anything you want the Mission creator to know?",
  emptyInterests: "No one has expressed interest yet.",
  interestedPeople: "Interested people",
  readBoundary: "Open work is a request for help, not a binding job or contract. No compensation, MCUs, or ownership have been promised by this posting.",
} as const;

export const interestLimits = { note: { max: 500 } } as const;

export type InterestDraft = { note: string; shareEmail: true };

export function interestDraft(input: Record<string, unknown>): InterestDraft {
  if (input.shareEmail !== true) throw new MissionInputError("Share your verified email before sending interest.");
  if (input.note !== undefined && input.note !== null && typeof input.note !== "string") throw new MissionInputError("Private note must be text.");
  const note = typeof input.note === "string" ? input.note.trim().replace(/\s+/g, " ") : "";
  if (note.length > interestLimits.note.max) throw new MissionInputError(`Private note must be at most ${interestLimits.note.max} characters.`);
  return { note, shareEmail: true };
}

export function interestCountLabel(count: number) {
  return count === 1 ? "1 person interested" : `${count} people interested`;
}

export type ProjectDraft = { title: string; outcome: string };
export type WorkKind = "task" | "role";
export type WorkDraft = { kind: WorkKind; title: string; description: string; doneWhen: string };

export type PublicProject = {
  missionSlug: string;
  slug: string;
  status: "active";
  title: string;
  outcome: string;
  createdAt: string;
  openWorkCount: number;
};

export type PublicWork = {
  missionSlug: string;
  projectSlug: string;
  slug: string;
  kind: WorkKind;
  status: "open";
  title: string;
  description: string;
  doneWhen: string;
  createdAt: string;
  interestCount: number;
};

export function projectDraft(input: Record<string, unknown>): ProjectDraft {
  return {
    title: field(input.title, "Project title", projectLimits.title.min, projectLimits.title.max),
    outcome: field(input.outcome, "Outcome", projectLimits.outcome.min, projectLimits.outcome.max),
  };
}

export function workDraft(input: Record<string, unknown>): WorkDraft {
  if (input.kind !== "task" && input.kind !== "role") throw new MissionInputError("Type must be a task or a role.");
  return {
    kind: input.kind,
    title: field(input.title, "Title", workLimits.title.min, workLimits.title.max),
    description: field(input.description, "What needs doing", workLimits.description.min, workLimits.description.max),
    doneWhen: field(input.doneWhen, "Done when", workLimits.doneWhen.min, workLimits.doneWhen.max),
  };
}

export function scopedSlugBase(value: string, fallback: string) {
  const base = value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/g, "");
  return base || fallback;
}

export function publicProjectUrl(missionSlug: string, projectSlug: string) {
  return `/missions/${missionSlug}/projects/${projectSlug}`;
}

export function publicWorkUrl(missionSlug: string, projectSlug: string, workSlug: string) {
  return `/missions/${missionSlug}/projects/${projectSlug}/work/${workSlug}`;
}
