import type {
  ContributionEvent,
  Contributor,
  EconomicOwnership,
  SimulationOptions,
} from "./types";
import {
  AGE_BANDS,
  contributionAgeYears,
  persistenceWeight,
  type DualPoolSplit,
  type PersistenceModel,
} from "./persistence";
import { roundUnits } from "./util";

function defaultPersistence(
  options: SimulationOptions,
): PersistenceModel {
  return options.persistence ?? { kind: "permanent" };
}

function modelLabel(
  model: PersistenceModel,
  dual?: DualPoolSplit,
): string {
  let base =
    model.kind === "permanent"
      ? "permanent"
      : model.kind === "hard"
        ? `hard-${model.years}y`
        : model.kind === "linear"
          ? `linear-${model.years}y`
          : `exp-hl-${model.halfLifeYears}y`;
  if (dual) {
    base += ` + pool ${Math.round(dual.currentShare * 100)}/${Math.round(dual.legacyShare * 100)}`;
  }
  return base;
}

/**
 * Compute EMU (or dual-pool weights) as of a period without mutating MU events.
 */
export function computeEconomicOwnership(
  events: ContributionEvent[],
  contributors: Contributor[],
  asOfPeriod: string,
  options: SimulationOptions,
): EconomicOwnership {
  const model = defaultPersistence(options);
  const dual = options.dualPool;
  const windowY = options.currentWindowYears ?? 5;
  const finalized = events.filter((e) => e.status === "FINALIZED");

  const byId: Record<string, { mu: number; emu: number }> = {};
  for (const c of contributors) byId[c.id] = { mu: 0, emu: 0 };

  const bandEmu: Record<string, number> = {};
  for (const b of AGE_BANDS) bandEmu[b.id] = 0;

  // For dual pool: track recent-window EMU vs all-MU legacy separately
  const currentWeight: Record<string, number> = {};
  const legacyWeight: Record<string, number> = {};
  for (const c of contributors) {
    currentWeight[c.id] = 0;
    legacyWeight[c.id] = 0;
  }

  for (const e of finalized) {
    if (!byId[e.contributorId]) {
      byId[e.contributorId] = { mu: 0, emu: 0 };
    }
    const age = contributionAgeYears(e.period, asOfPeriod);
    const w = persistenceWeight(age, model);
    // REVERSAL units are negative; apply same persistence to keep ledger consistent
    const emu = e.units * w;
    byId[e.contributorId]!.mu += e.units;
    byId[e.contributorId]!.emu += emu;

    for (const b of AGE_BANDS) {
      if (age >= b.min && age < b.max) {
        bandEmu[b.id] = (bandEmu[b.id] ?? 0) + Math.max(0, emu);
        break;
      }
    }

    if (dual) {
      legacyWeight[e.contributorId] =
        (legacyWeight[e.contributorId] ?? 0) + e.units; // permanent MU for legacy pool
      if (age < windowY) {
        currentWeight[e.contributorId] =
          (currentWeight[e.contributorId] ?? 0) + emu;
      }
    }
  }

  const names = Object.fromEntries(contributors.map((c) => [c.id, c.name]));
  const byContributor: EconomicOwnership["byContributor"] = {};

  if (dual) {
    const sumCurrent = Object.values(currentWeight).reduce((a, b) => a + b, 0);
    const sumLegacy = Object.values(legacyWeight).reduce((a, b) => a + b, 0);
    let totalEmu = 0;
    for (const id of Object.keys(byId)) {
      const cur =
        sumCurrent > 0
          ? (currentWeight[id]! / sumCurrent) * dual.currentShare
          : 0;
      const leg =
        sumLegacy > 0 ? (legacyWeight[id]! / sumLegacy) * dual.legacyShare : 0;
      const economicShare = cur + leg;
      totalEmu += economicShare; // here "emu" stands in for weight units summing to 1
      byContributor[id] = {
        mu: roundUnits(byId[id]?.mu ?? 0),
        emu: roundUnits(economicShare * 100), // store as percent-points scale for display consistency
        economicPercent: economicShare * 100,
        name: names[id] ?? id,
      };
    }
    // Renormalize age bands under dual: use persistence-weighted positive emu for memory chart
    const bandTotal = Object.values(bandEmu).reduce((a, b) => a + b, 0) || 1;
    return {
      modelLabel: modelLabel(model, dual),
      totalEmu: roundUnits(totalEmu),
      byContributor,
      ageBands: AGE_BANDS.map((b) => ({
        id: b.id,
        label: b.label,
        percent: roundUnits(((bandEmu[b.id] ?? 0) / bandTotal) * 100),
      })),
      dualPool: {
        currentShare: dual.currentShare,
        legacyShare: dual.legacyShare,
        currentWindowYears: windowY,
      },
    };
  }

  const totalEmu = Object.values(byId).reduce((a, row) => a + row.emu, 0);
  for (const [id, row] of Object.entries(byId)) {
    byContributor[id] = {
      mu: roundUnits(row.mu),
      emu: roundUnits(row.emu),
      economicPercent: totalEmu > 0 ? (row.emu / totalEmu) * 100 : 0,
      name: names[id] ?? id,
    };
  }

  const bandTotal = Object.values(bandEmu).reduce((a, b) => a + b, 0) || 1;

  return {
    modelLabel: modelLabel(model),
    totalEmu: roundUnits(totalEmu),
    byContributor,
    ageBands: AGE_BANDS.map((b) => ({
      id: b.id,
      label: b.label,
      percent: roundUnits(((bandEmu[b.id] ?? 0) / bandTotal) * 100),
    })),
  };
}
