import type {
  CohortReport,
  ContributionEvent,
  OwnershipSnapshot,
  PersistenceMetrics,
  SimulationInput,
  SimulationOptions,
} from "./types";
import { activeFraction, parsePeriod, roundUnits } from "./util";

function periodYear(period: string): number {
  return parsePeriod(period).y;
}

export function computeCohorts(
  input: SimulationInput,
  final: OwnershipSnapshot,
  events: ContributionEvent[],
  options: SimulationOptions,
  finalPeriod: string,
): CohortReport {
  let active = 0;
  let retired = 0;
  let inherited = 0;
  let founder = 0;

  const fy = periodYear(finalPeriod);
  const total = final.totalUnits || 1;

  const recent5Units = events
    .filter(
      (e) =>
        e.status === "FINALIZED" &&
        periodYear(e.period) > fy - 5 &&
        periodYear(e.period) <= fy,
    )
    .reduce((a, e) => a + e.units, 0);
  const recent10Units = events
    .filter(
      (e) =>
        e.status === "FINALIZED" &&
        periodYear(e.period) > fy - 10 &&
        periodYear(e.period) <= fy,
    )
    .reduce((a, e) => a + e.units, 0);
  const historicalUnits = events
    .filter(
      (e) => e.status === "FINALIZED" && periodYear(e.period) <= fy - 10,
    )
    .reduce((a, e) => a + e.units, 0);

  for (const c of input.contributors) {
    const row = final.byContributor[c.id];
    if (!row) continue;
    const pct = row.percent;
    const isActive = activeFraction(c, finalPeriod) > 0;

    if (c.isFounder) founder += pct;

    if (options.inheritanceLabeling && !isActive) {
      inherited += pct;
    } else if (isActive) {
      active += pct;
    } else {
      retired += pct;
    }
  }

  return {
    activePct: roundUnits(active),
    retiredPct: roundUnits(retired),
    inheritedPct: roundUnits(inherited),
    founderPct: roundUnits(founder),
    recent5Pct: roundUnits((recent5Units / total) * 100),
    recent10Pct: roundUnits((recent10Units / total) * 100),
    historicalPct: roundUnits((historicalUnits / total) * 100),
  };
}

export function ownershipHalfLifeYears(
  totalUnits: number,
  annualNewMu: number,
): number | null {
  if (annualNewMu <= 0 || totalUnits <= 0) return null;
  return totalUnits / annualNewMu;
}

export function projectedPercent(
  units: number,
  totalUnits: number,
  annualNewMu: number,
  years: number,
): number {
  const denom = totalUnits + annualNewMu * years;
  if (denom <= 0) return 0;
  return (units / denom) * 100;
}

export function computePersistence(
  input: SimulationInput,
  final: OwnershipSnapshot,
  events: ContributionEvent[],
  periods: string[],
): PersistenceMetrics[] {
  const last = periods[periods.length - 1]!;
  const cutoffY = periodYear(last);
  const recent = events.filter(
    (e) =>
      e.status === "FINALIZED" &&
      e.type !== "REVERSAL" &&
      periodYear(e.period) === cutoffY,
  );
  const yearUnits = recent.reduce((a, e) => a + e.units, 0);
  const monthsInYear = periods.filter((p) => periodYear(p) === cutoffY).length;
  const annualNewMu =
    monthsInYear > 0 ? (yearUnits / monthsInYear) * 12 : yearUnits;

  const halfLife = ownershipHalfLifeYears(final.totalUnits, annualNewMu);

  return input.contributors.map((c) => {
    const row = final.byContributor[c.id] ?? {
      units: 0,
      percent: 0,
      name: c.name,
    };
    return {
      contributorId: c.id,
      name: c.name,
      units: row.units,
      percent: row.percent,
      missionAnnualNewMu: roundUnits(annualNewMu),
      projectedPct1y: roundUnits(
        projectedPercent(row.units, final.totalUnits, annualNewMu, 1),
      ),
      projectedPct5y: roundUnits(
        projectedPercent(row.units, final.totalUnits, annualNewMu, 5),
      ),
      projectedPct10y: roundUnits(
        projectedPercent(row.units, final.totalUnits, annualNewMu, 10),
      ),
      halfLifeYears: halfLife === null ? null : roundUnits(halfLife),
    };
  });
}

export function runSensitivity(
  base: SimulationInput,
  run: (input: SimulationInput) => { final: OwnershipSnapshot },
  param: "atRiskLaborMultiplier" | "cashRiskMultiplier",
  values: number[],
): { value: number; percents: Record<string, number> }[] {
  return values.map((value) => {
    const result = run({
      ...base,
      policy: { ...base.policy, [param]: value },
    });
    const percents: Record<string, number> = {};
    for (const [id, row] of Object.entries(result.final.byContributor)) {
      percents[id] = roundUnits(row.percent);
    }
    return { value, percents };
  });
}
