/**
 * Outcome-based Mission Units (experimental).
 *
 * Invariant: every MU must be reproducible from
 *   raw facts → policy version → deterministic KPI attainment
 *   → weighted score → reference contribution → risk treatment → MU
 *
 * There is no editable human-entered number whose sole meaning is
 * “how valuable we thought this person was.”
 */

export type RatioKpiPolicy = {
  kind: "ratio";
  id: string;
  weight: number;
  /** Target raw value for 100% attainment. */
  target: number;
  /** Cap applied to this KPI's attainment before weighting (e.g. 2.0). */
  attainmentCap: number;
};

export type MilestoneKpiPolicy = {
  kind: "milestone";
  id: string;
  weight: number;
  attainmentCap: number;
  /**
   * Prospectively written acceptance levels.
   * attainment = level when facts.levelAchieved matches; else 0.
   * Typical: { "met": 1.0, "stretch": 1.5 } or binary { "met": 1.0 }.
   */
  acceptanceLevels: Record<string, number>;
};

export type KpiPolicy = RatioKpiPolicy | MilestoneKpiPolicy;

export type ScorecardPolicy = {
  version: string;
  effectiveAt: string; // ISO date
  /** Cap on the weighted score after per-KPI caps (e.g. 2.0). */
  scoreCap: number;
  kpis: KpiPolicy[];
};

/** Observable facts for one evaluation period — never a performance %. */
export type RatioKpiFact = {
  id: string;
  kind: "ratio";
  /** Measured raw value (revenue dollars, QBP count, etc.). */
  measured: number;
};

export type MilestoneKpiFact = {
  id: string;
  kind: "milestone";
  /**
   * Which prospectively defined acceptance level was achieved,
   * or null/undefined if none. Must be a key in acceptanceLevels.
   */
  levelAchieved: string | null;
};

export type KpiFact = RatioKpiFact | MilestoneKpiFact;

export type OutcomeMuInput = {
  policy: ScorecardPolicy;
  /** Period target contribution value (from role reference × capacity). */
  periodReferenceValue: number;
  facts: KpiFact[];
  /**
   * Guaranteed / base role cash committed prospectively for this period
   * (salary, retainer). Contingent commissions are NOT included.
   */
  guaranteedRoleCash: number;
  laborMultiplier?: number; // default 1
  atRiskLaborMultiplier?: number; // default 2
};

export type KpiAttainment = {
  id: string;
  weight: number;
  rawAttainment: number;
  cappedAttainment: number;
  weightedContribution: number;
};

export type OutcomeMuResult = {
  policyVersion: string;
  kpiAttainments: KpiAttainment[];
  weightedScore: number; // after per-KPI caps, before score cap
  cappedScore: number;
  outcomeValue: number;
  normalMu: number;
  uncompensated: number;
  atRiskMu: number;
  totalMu: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function deriveAttainment(policy: KpiPolicy, fact: KpiFact | undefined): number {
  if (!fact || fact.kind !== policy.kind) {
    return 0;
  }
  if (policy.kind === "ratio" && fact.kind === "ratio") {
    if (policy.target <= 0) {
      throw new Error(`KPI ${policy.id}: target must be > 0`);
    }
    return fact.measured / policy.target;
  }
  if (policy.kind === "milestone" && fact.kind === "milestone") {
    if (fact.levelAchieved == null) return 0;
    const level = policy.acceptanceLevels[fact.levelAchieved];
    if (level === undefined) {
      throw new Error(
        `KPI ${policy.id}: unknown acceptance level "${fact.levelAchieved}"`,
      );
    }
    return level;
  }
  return 0;
}

/**
 * Deterministic MU from versioned scorecard policy + raw facts.
 * Per-KPI attainment is capped before weighting; overall scoreCap applies second.
 * At-risk offset uses guaranteedRoleCash only — not contingent commissions.
 */
export function computeOutcomeMu(input: OutcomeMuInput): OutcomeMuResult {
  const labor = input.laborMultiplier ?? 1;
  const atRisk = input.atRiskLaborMultiplier ?? 2;
  const { policy } = input;

  const weightSum = policy.kpis.reduce((a, k) => a + k.weight, 0);
  if (Math.abs(weightSum - 1) > 1e-6) {
    throw new Error(`KPI weights must sum to 1 (got ${weightSum})`);
  }

  const factsById = new Map(input.facts.map((f) => [f.id, f]));

  const kpiAttainments: KpiAttainment[] = policy.kpis.map((kpi) => {
    const raw = deriveAttainment(kpi, factsById.get(kpi.id));
    const capped = Math.min(kpi.attainmentCap, Math.max(0, raw));
    return {
      id: kpi.id,
      weight: kpi.weight,
      rawAttainment: round4(raw),
      cappedAttainment: round4(capped),
      weightedContribution: round4(kpi.weight * capped),
    };
  });

  const weightedScore = kpiAttainments.reduce(
    (a, k) => a + k.weightedContribution,
    0,
  );
  const cappedScore = Math.min(policy.scoreCap, Math.max(0, weightedScore));
  const outcomeValue = round2(input.periodReferenceValue * cappedScore);
  const normalMu = round2(outcomeValue * labor);
  const uncompensated = round2(
    Math.max(0, outcomeValue - input.guaranteedRoleCash),
  );
  const atRiskMu = round2(uncompensated * Math.max(0, atRisk - labor));
  const totalMu = round2(normalMu + atRiskMu);

  return {
    policyVersion: policy.version,
    kpiAttainments,
    weightedScore: round4(weightedScore),
    cappedScore: round4(cappedScore),
    outcomeValue,
    normalMu,
    uncompensated,
    atRiskMu,
    totalMu,
  };
}

/** $75/hr × hoursPerWeek × 13 weeks. */
export function quarterlyReferenceFromHourly(
  hourlyRate: number,
  hoursPerWeek: number,
  weeksPerQuarter = 13,
): number {
  return round2(hourlyRate * hoursPerWeek * weeksPerQuarter);
}

/** Pilot reference: six-month epoch = 26 weeks. */
export function periodReferenceFromHourly(
  hourlyRate: number,
  hoursPerWeek: number,
  weeks: number,
): number {
  return round2(hourlyRate * hoursPerWeek * weeks);
}

/**
 * Illustrative Benchmark six-month scorecard.
 * Authoritative epoch = 6 months. Monthly/quarterly views are dashboards only.
 * GoPrivate has no prospective MU until a separate scorecard is jointly adopted.
 *
 * growth-leverage acceptance criteria are prospective and mechanical.
 * Do not use QBP-count criteria here (that would double-count KPI 2).
 */
export const BENCHMARK_SCORECARD_V01: ScorecardPolicy = {
  version: "benchmark-6m-v0.1",
  effectiveAt: "2026-10-01",
  scoreCap: 2,
  kpis: [
    {
      kind: "ratio",
      id: "economic-growth",
      weight: 0.5,
      target: 100_000, // six-month; 200% cap ⇒ $200,000
      attainmentCap: 2,
    },
    {
      kind: "ratio",
      id: "qualified-buying-processes",
      weight: 0.3,
      target: 12, // six-month; 200% cap ⇒ 24
      attainmentCap: 2,
    },
    {
      kind: "milestone",
      id: "growth-leverage",
      weight: 0.2,
      attainmentCap: 2,
      // Growth-system criteria. Not a count of qualified buying processes.
      acceptanceLevels: {
        met: 1.0,
        stretch: 1.5,
      },
    },
  ],
};

/** Benchmark six-month reference: $75 × 10 hrs/week × 26 weeks. */
export const PILOT_SIX_MONTH_REFERENCE = periodReferenceFromHourly(
  75,
  10,
  26,
);
