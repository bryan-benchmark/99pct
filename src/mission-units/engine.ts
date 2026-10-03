import type {
  CashInvestment,
  ContributionEvent,
  Contributor,
  GenesisImport,
  MissionEconomicPolicy,
  OwnershipSnapshot,
  SimulationInput,
  SimulationOptions,
  SimulationResult,
} from "./types";
import { computeCohorts, computePersistence } from "./metrics";
import { computeEconomicOwnership } from "./economics";
import {
  activeFraction,
  listPeriods,
  monthlyFromAnnual,
  parsePeriod,
  periodKey,
  roundUnits,
} from "./util";

export {
  activeFraction,
  almostEqual,
  listPeriods,
  monthlyFromAnnual,
  parsePeriod,
  periodKey,
  roundUnits,
} from "./util";

let seq = 0;
export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function resetIdSeq(): void {
  seq = 0;
}

export const defaultOptions = (
  partial?: Partial<SimulationOptions>,
): SimulationOptions => ({
  referenceMode: "real",
  annualInflation: 0,
  realBaseYear: 2026,
  inheritanceLabeling: false,
  persistence: { kind: "permanent" },
  ...partial,
});

export function nominalize(
  startYearDollars: number,
  year: number,
  startYear: number,
  annualInflation: number,
): number {
  if (annualInflation === 0) return startYearDollars;
  return startYearDollars * Math.pow(1 + annualInflation, year - startYear);
}

export function toRealBase(
  nominal: number,
  year: number,
  realBaseYear: number,
  annualInflation: number,
): number {
  if (annualInflation === 0) return nominal;
  return nominal / Math.pow(1 + annualInflation, year - realBaseYear);
}

export function makeEvent(
  partial: Omit<ContributionEvent, "units"> & { units?: number },
): ContributionEvent {
  if (partial.type === "REVERSAL") {
    if (!partial.reversesEventId) {
      throw new Error("REVERSAL requires reversesEventId");
    }
    if (partial.units === undefined) {
      throw new Error("REVERSAL requires explicit units (negative of original)");
    }
    return { ...partial, units: partial.units };
  }
  const units = roundUnits(partial.referenceValue * partial.multiplier);
  return { ...partial, units };
}

export function expandGenesisImports(
  missionId: string,
  imports: GenesisImport[],
  policy: MissionEconomicPolicy,
): ContributionEvent[] {
  const events: ContributionEvent[] = [];
  for (const g of imports) {
    if (g.historicalLabor) {
      const { months, referenceAnnual, cashAnnual, endPeriod } =
        g.historicalLabor;
      const monthlyRef = monthlyFromAnnual(referenceAnnual);
      const monthlyCash = monthlyFromAnnual(cashAnnual);
      const end = parsePeriod(endPeriod);
      for (let i = months - 1; i >= 0; i--) {
        let m = end.m - i;
        let y = end.y;
        while (m <= 0) {
          m += 12;
          y -= 1;
        }
        const period = periodKey(y, m);
        events.push(
          makeEvent({
            id: nextId("gen"),
            missionId,
            contributorId: g.contributorId,
            occurredAt: `${period}-15`,
            period,
            type: "LABOR",
            referenceValue: roundUnits(monthlyRef),
            multiplier: policy.laborMultiplier,
            explanation: `Genesis import: historical labor ${period}`,
            status: "FINALIZED",
            policyVersion: policy.version,
          }),
        );
        const unpaid = monthlyRef - monthlyCash;
        if (unpaid > 0.005) {
          events.push(
            makeEvent({
              id: nextId("gen"),
              missionId,
              contributorId: g.contributorId,
              occurredAt: `${period}-15`,
              period,
              type: "AT_RISK_LABOR",
              referenceValue: roundUnits(unpaid),
              multiplier: policy.atRiskLaborMultiplier,
              explanation: `Genesis import: historical at-risk labor ${period}`,
              status: "FINALIZED",
              policyVersion: policy.version,
            }),
          );
        }
      }
    }
    if (g.cash) {
      events.push(
        makeEvent({
          id: nextId("gen"),
          missionId,
          contributorId: g.contributorId,
          occurredAt: g.cash.date,
          period: g.cash.date.slice(0, 7),
          type: "CASH",
          referenceValue: g.cash.amount,
          multiplier: policy.cashRiskMultiplier,
          explanation: `Genesis import: ${g.cash.explanation}`,
          status: "FINALIZED",
          policyVersion: policy.version,
        }),
      );
    }
    for (const ex of g.expenses ?? []) {
      events.push(
        makeEvent({
          id: nextId("gen"),
          missionId,
          contributorId: g.contributorId,
          occurredAt: ex.date,
          period: ex.date.slice(0, 7),
          type: "EXPENSE",
          referenceValue: ex.amount,
          multiplier: policy.expenseRiskMultiplier,
          explanation: `Genesis import: ${ex.explanation}`,
          status: "FINALIZED",
          policyVersion: policy.version,
        }),
      );
    }
  }
  return events;
}

export function generateLaborEvents(
  missionId: string,
  contributor: Contributor,
  period: string,
  policy: MissionEconomicPolicy,
  options: SimulationOptions,
  wageStartYear: number,
): ContributionEvent[] {
  const frac = activeFraction(contributor, period);
  if (frac <= 0) return [];

  const year = parsePeriod(period).y;
  let monthlyRef =
    monthlyFromAnnual(
      nominalize(
        contributor.referenceAnnual,
        year,
        wageStartYear,
        options.annualInflation,
      ),
    ) * frac;
  let monthlyCash =
    monthlyFromAnnual(
      nominalize(
        contributor.cashAnnual,
        year,
        wageStartYear,
        options.annualInflation,
      ),
    ) * frac;

  if (options.referenceMode === "real") {
    monthlyRef = toRealBase(
      monthlyRef,
      year,
      options.realBaseYear,
      options.annualInflation,
    );
    monthlyCash = toRealBase(
      monthlyCash,
      year,
      options.realBaseYear,
      options.annualInflation,
    );
  }

  const events: ContributionEvent[] = [];
  events.push(
    makeEvent({
      id: nextId("evt"),
      missionId,
      contributorId: contributor.id,
      occurredAt: `${period}-28`,
      period,
      type: "LABOR",
      referenceValue: roundUnits(monthlyRef),
      multiplier: policy.laborMultiplier,
      explanation: `Labor ${(frac * 100).toFixed(0)}% mo; mode=${options.referenceMode}`,
      status: "FINALIZED",
      policyVersion: policy.version,
    }),
  );

  const unpaid = monthlyRef - monthlyCash;
  if (unpaid > 0.005) {
    events.push(
      makeEvent({
        id: nextId("evt"),
        missionId,
        contributorId: contributor.id,
        occurredAt: `${period}-28`,
        period,
        type: "AT_RISK_LABOR",
        referenceValue: roundUnits(unpaid),
        multiplier: policy.atRiskLaborMultiplier,
        explanation: `At-risk: ref ${roundUnits(monthlyRef)} − cash ${roundUnits(monthlyCash)}`,
        status: "FINALIZED",
        policyVersion: policy.version,
      }),
    );
  }

  return events;
}

export function generateCashEvents(
  missionId: string,
  investment: CashInvestment,
  policy: MissionEconomicPolicy,
): ContributionEvent {
  return makeEvent({
    id: nextId("evt"),
    missionId,
    contributorId: investment.contributorId,
    occurredAt: investment.date,
    period: investment.date.slice(0, 7),
    type: "CASH",
    referenceValue: investment.amount,
    multiplier: policy.cashRiskMultiplier,
    explanation: investment.explanation,
    status: "FINALIZED",
    policyVersion: policy.version,
  });
}

export function reverseEvent(
  original: ContributionEvent,
  explanation: string,
): ContributionEvent {
  if (original.status !== "FINALIZED") {
    throw new Error("Can only reverse FINALIZED events");
  }
  if (original.type === "REVERSAL") {
    throw new Error("Cannot reverse a REVERSAL");
  }
  return makeEvent({
    id: nextId("rev"),
    missionId: original.missionId,
    contributorId: original.contributorId,
    occurredAt: original.occurredAt,
    period: original.period,
    type: "REVERSAL",
    referenceValue: 0,
    multiplier: 0,
    units: -original.units,
    explanation,
    status: "FINALIZED",
    policyVersion: original.policyVersion,
    reversesEventId: original.id,
  });
}

export function correctEvent(
  original: ContributionEvent,
  replacement: Omit<
    ContributionEvent,
    "id" | "status" | "units" | "reversesEventId" | "replacementForEventId"
  >,
): ContributionEvent[] {
  const rev = reverseEvent(original, `Reversal of ${original.id}`);
  const fixed = makeEvent({
    ...replacement,
    id: nextId("fix"),
    status: "FINALIZED",
    replacementForEventId: original.id,
  });
  return [rev, fixed];
}

export function ownershipFromEvents(
  events: ContributionEvent[],
  contributors: Contributor[],
  periodLabel: string,
): OwnershipSnapshot {
  const finalized = events.filter((e) => e.status === "FINALIZED");
  const byId: Record<string, number> = {};
  for (const c of contributors) byId[c.id] = 0;
  for (const e of finalized) {
    byId[e.contributorId] = (byId[e.contributorId] ?? 0) + e.units;
  }
  const totalUnits = Object.values(byId).reduce((a, b) => a + b, 0);
  const names = Object.fromEntries(contributors.map((c) => [c.id, c.name]));
  const byContributor: OwnershipSnapshot["byContributor"] = {};
  for (const [id, units] of Object.entries(byId)) {
    byContributor[id] = {
      units: roundUnits(units),
      percent: totalUnits > 0 ? (units / totalUnits) * 100 : 0,
      name: names[id] ?? id,
    };
  }
  return {
    period: periodLabel,
    totalUnits: roundUnits(totalUnits),
    byContributor,
  };
}

function policyForPeriod(
  input: SimulationInput,
  period: string,
): MissionEconomicPolicy {
  if (input.policyChange && period >= input.policyChange.effectivePeriod) {
    return input.policyChange.policy;
  }
  return input.policy;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  resetIdSeq();
  const options = defaultOptions(input.options);
  const wageStartYear = parsePeriod(input.startPeriod).y;
  const events: ContributionEvent[] = [];

  events.push(
    ...expandGenesisImports(
      input.missionId,
      input.genesisImports ?? [],
      input.policy,
    ),
  );

  for (const inv of input.cashInvestments) {
    events.push(generateCashEvents(input.missionId, inv, input.policy));
  }

  const periods = listPeriods(input.startPeriod, input.endPeriod);
  const snapshots: OwnershipSnapshot[] = [];

  for (const period of periods) {
    const policy = policyForPeriod(input, period);
    for (const c of input.contributors) {
      events.push(
        ...generateLaborEvents(
          input.missionId,
          c,
          period,
          policy,
          options,
          wageStartYear,
        ),
      );
    }
    const through = events.filter((e) => e.period <= period);
    snapshots.push(ownershipFromEvents(through, input.contributors, period));
  }

  const final = snapshots[snapshots.length - 1]!;
  const finalPeriod = periods[periods.length - 1]!;
  const cohorts = computeCohorts(
    input,
    final,
    events,
    options,
    finalPeriod,
  );
  const persistence = computePersistence(input, final, events, periods);
  const economic = computeEconomicOwnership(
    events,
    input.contributors,
    finalPeriod,
    options,
  );

  return { events, snapshots, final, options, cohorts, persistence, economic };
}

export function explainOwnership(
  result: SimulationResult,
  contributorId: string,
  throughPeriod?: string,
): {
  lines: {
    period: string;
    type: string;
    units: number;
    explanation: string;
  }[];
  total: number;
  missionTotal: number;
  percent: number;
} {
  const through = throughPeriod ?? result.final.period;
  const mine = result.events.filter(
    (e) =>
      e.contributorId === contributorId &&
      e.status === "FINALIZED" &&
      e.period <= through,
  );
  const all = result.events.filter(
    (e) => e.status === "FINALIZED" && e.period <= through,
  );
  const total = mine.reduce((a, e) => a + e.units, 0);
  const missionTotal = all.reduce((a, e) => a + e.units, 0);
  return {
    lines: mine.map((e) => ({
      period: e.period,
      type: e.type,
      units: e.units,
      explanation: e.explanation,
    })),
    total: roundUnits(total),
    missionTotal: roundUnits(missionTotal),
    percent: missionTotal > 0 ? (total / missionTotal) * 100 : 0,
  };
}

export function assertNoManualPercentApi(): void {
  // Ownership is only derived via ownershipFromEvents / runSimulation.
}
