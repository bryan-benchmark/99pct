/**
 * V0.2 persistence: MU stay permanent; economic force is derived.
 * Not Canonical.
 */

export type PersistenceModel =
  | { kind: "permanent" }
  | { kind: "hard"; years: number }
  | { kind: "linear"; years: number }
  | { kind: "exponential"; halfLifeYears: number };

/** Age of contribution in years from earning period to valuation period. */
export function contributionAgeYears(
  earnedPeriod: string,
  asOfPeriod: string,
): number {
  const [ey, em] = earnedPeriod.split("-").map(Number);
  const [ay, am] = asOfPeriod.split("-").map(Number);
  return (ay! - ey!) + (am! - em!) / 12;
}

/**
 * persistence ∈ [0, 1] as a function of age in years.
 * Never mutates MU — only scales economic force.
 */
export function persistenceWeight(
  ageYears: number,
  model: PersistenceModel,
): number {
  if (ageYears < 0) return 1;
  switch (model.kind) {
    case "permanent":
      return 1;
    case "hard":
      return ageYears < model.years ? 1 : 0;
    case "linear": {
      if (model.years <= 0) return 0;
      return Math.max(0, 1 - ageYears / model.years);
    }
    case "exponential": {
      if (model.halfLifeYears <= 0) return 0;
      return Math.pow(0.5, ageYears / model.halfLifeYears);
    }
  }
}

export type DualPoolSplit = {
  /** Fraction of economics allocated by recent/current contribution weights. */
  currentShare: number;
  /** Fraction allocated by all historical MU (permanent legacy claim). */
  legacyShare: number;
};

export const PERSISTENCE_PRESETS: { id: string; label: string; model: PersistenceModel }[] =
  [
    { id: "permanent", label: "Permanent (v0.1)", model: { kind: "permanent" } },
    { id: "hard-5", label: "Hard expire 5y", model: { kind: "hard", years: 5 } },
    { id: "hard-10", label: "Hard expire 10y", model: { kind: "hard", years: 10 } },
    { id: "hard-20", label: "Hard expire 20y", model: { kind: "hard", years: 20 } },
    {
      id: "linear-10",
      label: "Linear 10y",
      model: { kind: "linear", years: 10 },
    },
    {
      id: "linear-20",
      label: "Linear 20y",
      model: { kind: "linear", years: 20 },
    },
    {
      id: "exp-2",
      label: "Exponential half-life 2y",
      model: { kind: "exponential", halfLifeYears: 2 },
    },
    {
      id: "exp-5",
      label: "Exponential half-life 5y",
      model: { kind: "exponential", halfLifeYears: 5 },
    },
    {
      id: "exp-10",
      label: "Exponential half-life 10y",
      model: { kind: "exponential", halfLifeYears: 10 },
    },
    {
      id: "exp-20",
      label: "Exponential half-life 20y",
      model: { kind: "exponential", halfLifeYears: 20 },
    },
    {
      id: "exp-40",
      label: "Exponential half-life 40y",
      model: { kind: "exponential", halfLifeYears: 40 },
    },
  ];

export const AGE_BANDS = [
  { id: "0-5", label: "0–5 years", min: 0, max: 5 },
  { id: "5-10", label: "5–10 years", min: 5, max: 10 },
  { id: "10-20", label: "10–20 years", min: 10, max: 20 },
  { id: "20-40", label: "20–40 years", min: 20, max: 40 },
  { id: "40+", label: "40+ years", min: 40, max: Infinity },
] as const;
