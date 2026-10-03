import { defaultPolicyV01 } from "./policy";
import type { Contributor, GenesisImport, SimulationInput } from "./types";

function genesisLabor(
  contributorId: string,
  months: number,
  referenceAnnual: number,
  cashAnnual: number,
  endPeriod: string,
  cash?: GenesisImport["cash"],
): GenesisImport {
  return {
    contributorId,
    historicalLabor: { months, referenceAnnual, cashAnnual, endPeriod },
    cash,
  };
}

/** 24-month startup — Benchmark-like. Do not tune results yet. */
export function scenarioBenchmarkLike(): SimulationInput {
  return {
    missionId: "benchmark",
    missionName: "1 · Startup 24mo (Benchmark-like)",
    policy: defaultPolicyV01("2024-01-01"),
    startPeriod: "2024-01",
    endPeriod: "2025-12",
    contributors: [
      {
        id: "bryan",
        name: "Bryan (founder)",
        referenceAnnual: 180_000,
        cashAnnual: 40_000,
        startDate: "2024-01-01",
        isFounder: true,
      },
      {
        id: "riley",
        name: "Riley (founder)",
        referenceAnnual: 160_000,
        cashAnnual: 80_000,
        startDate: "2024-01-01",
        isFounder: true,
      },
      {
        id: "alice",
        name: "Alice (eng)",
        referenceAnnual: 150_000,
        cashAnnual: 150_000,
        startDate: "2024-04-01",
      },
      {
        id: "cara",
        name: "Cara (ops)",
        referenceAnnual: 110_000,
        cashAnnual: 110_000,
        startDate: "2024-07-01",
        endDate: "2025-06-30",
      },
    ],
    cashInvestments: [
      {
        id: "cash-bryan",
        contributorId: "bryan",
        date: "2024-01-15",
        amount: 50_000,
        explanation: "Founder cash at risk",
      },
      {
        id: "cash-riley",
        contributorId: "riley",
        date: "2024-02-01",
        amount: 25_000,
        explanation: "Founder cash at risk",
      },
    ],
    genesisImports: [
      genesisLabor("bryan", 18, 180_000, 40_000, "2023-12", {
        amount: 40_000,
        date: "2023-06-01",
        explanation: "Documented pre-ledger cash",
      }),
      genesisLabor("riley", 12, 160_000, 80_000, "2023-12"),
    ],
  };
}

export function scenarioCashHeavy(): SimulationInput {
  const base = scenarioBenchmarkLike();
  return {
    ...base,
    missionId: "cash-heavy",
    missionName: "11 · Capital-heavy (cash stress)",
    cashInvestments: [
      ...base.cashInvestments,
      {
        id: "whale",
        contributorId: "bryan",
        date: "2024-06-01",
        amount: 500_000,
        explanation: "Large cash injection",
      },
    ],
  };
}

export function scenarioFullyPaid(): SimulationInput {
  return {
    missionId: "fully-paid",
    missionName: "9 · Fully paid workforce (12mo)",
    policy: defaultPolicyV01("2025-01-01"),
    startPeriod: "2025-01",
    endPeriod: "2025-12",
    contributors: [
      {
        id: "f1",
        name: "Founder",
        referenceAnnual: 200_000,
        cashAnnual: 200_000,
        startDate: "2025-01-01",
        isFounder: true,
      },
      {
        id: "e1",
        name: "Employee A",
        referenceAnnual: 140_000,
        cashAnnual: 140_000,
        startDate: "2025-01-01",
      },
      {
        id: "e2",
        name: "Employee B",
        referenceAnnual: 100_000,
        cashAnnual: 100_000,
        startDate: "2025-03-01",
      },
    ],
    cashInvestments: [],
    genesisImports: [genesisLabor("f1", 6, 200_000, 200_000, "2024-12")],
  };
}

export function scenarioUnderpaidStartup(): SimulationInput {
  const base = scenarioBenchmarkLike();
  return {
    ...base,
    missionId: "underpaid",
    missionName: "10 · Heavily underpaid startup",
    contributors: base.contributors.map((c) => ({
      ...c,
      cashAnnual: Math.min(c.cashAnnual, c.referenceAnnual * 0.25),
    })),
  };
}

export function scenarioLaborHeavy(): SimulationInput {
  const base = scenarioBenchmarkLike();
  return {
    ...base,
    missionId: "labor-heavy",
    missionName: "12 · Labor-heavy (no cash invest)",
    cashInvestments: [],
  };
}

export function scenarioFounderLeavesY5(): SimulationInput {
  return {
    missionId: "founder-leaves-y5",
    missionName: "5 · Founder leaves year 5 (10yr)",
    policy: defaultPolicyV01("2020-01-01"),
    startPeriod: "2020-01",
    endPeriod: "2029-12",
    contributors: [
      {
        id: "f",
        name: "Founder",
        referenceAnnual: 180_000,
        cashAnnual: 60_000,
        startDate: "2020-01-01",
        endDate: "2024-12-31",
        isFounder: true,
      },
      {
        id: "e1",
        name: "Employee A",
        referenceAnnual: 140_000,
        cashAnnual: 140_000,
        startDate: "2020-01-01",
      },
      {
        id: "e2",
        name: "Employee B",
        referenceAnnual: 120_000,
        cashAnnual: 120_000,
        startDate: "2022-01-01",
      },
      {
        id: "e3",
        name: "Employee C",
        referenceAnnual: 130_000,
        cashAnnual: 130_000,
        startDate: "2025-01-01",
      },
    ],
    cashInvestments: [
      {
        id: "c1",
        contributorId: "f",
        date: "2020-01-15",
        amount: 80_000,
        explanation: "Founder cash",
      },
    ],
    genesisImports: [genesisLabor("f", 12, 180_000, 40_000, "2019-12")],
  };
}

export function scenarioAllFoundersLeaveY10(): SimulationInput {
  return {
    missionId: "founders-gone",
    missionName: "6 · All founders leave by year 10",
    policy: defaultPolicyV01("2015-01-01"),
    startPeriod: "2015-01",
    endPeriod: "2029-12",
    contributors: [
      {
        id: "f1",
        name: "Founder A",
        referenceAnnual: 180_000,
        cashAnnual: 50_000,
        startDate: "2015-01-01",
        endDate: "2024-06-30",
        isFounder: true,
      },
      {
        id: "f2",
        name: "Founder B",
        referenceAnnual: 160_000,
        cashAnnual: 50_000,
        startDate: "2015-01-01",
        endDate: "2024-12-31",
        isFounder: true,
      },
      {
        id: "e1",
        name: "Employee A",
        referenceAnnual: 140_000,
        cashAnnual: 140_000,
        startDate: "2018-01-01",
      },
      {
        id: "e2",
        name: "Employee B",
        referenceAnnual: 130_000,
        cashAnnual: 130_000,
        startDate: "2020-01-01",
      },
      {
        id: "e3",
        name: "Employee C",
        referenceAnnual: 150_000,
        cashAnnual: 150_000,
        startDate: "2025-01-01",
      },
    ],
    cashInvestments: [],
    genesisImports: [
      genesisLabor("f1", 6, 180_000, 40_000, "2014-12"),
      genesisLabor("f2", 6, 160_000, 40_000, "2014-12"),
    ],
  };
}

/** Growing headcount over 10 years. */
export function scenarioGrowing10y(): SimulationInput {
  const contributors: Contributor[] = [
    {
      id: "f",
      name: "Founder",
      referenceAnnual: 180_000,
      cashAnnual: 90_000,
      startDate: "2016-01-01",
      isFounder: true,
    },
  ];
  for (let y = 2016; y <= 2025; y++) {
    contributors.push({
      id: `h${y}`,
      name: `Hire ${y}`,
      referenceAnnual: 120_000,
      cashAnnual: 120_000,
      startDate: `${y}-01-01`,
    });
  }
  return {
    missionId: "growing-10y",
    missionName: "2 · Growing company 10yr",
    policy: defaultPolicyV01("2016-01-01"),
    startPeriod: "2016-01",
    endPeriod: "2025-12",
    contributors,
    cashInvestments: [],
    genesisImports: [genesisLabor("f", 12, 180_000, 60_000, "2015-12")],
  };
}

/** Flat headcount after growth — mature 50yr is expensive; use staggered careers. */
export function scenarioMature50y(): SimulationInput {
  const contributors: Contributor[] = [];
  // 5 overlapping career cohorts, 40-year careers, start every 10 years from 1976
  for (let wave = 0; wave < 5; wave++) {
    const startY = 1976 + wave * 10;
    for (let i = 0; i < 4; i++) {
      const id = `w${wave}p${i}`;
      contributors.push({
        id,
        name: `Wave${wave}-P${i}`,
        referenceAnnual: 100_000 + i * 10_000,
        cashAnnual: 100_000 + i * 10_000,
        startDate: `${startY}-01-01`,
        endDate: `${startY + 39}-12-31`,
        isFounder: wave === 0 && i === 0,
      });
    }
  }
  return {
    missionId: "mature-50y",
    missionName: "3 · Mature org ~50yr (cohort waves)",
    policy: defaultPolicyV01("1976-01-01"),
    startPeriod: "1976-01",
    endPeriod: "2025-12",
    contributors,
    cashInvestments: [],
    genesisImports: [],
    options: { inheritanceLabeling: false },
  };
}

/**
 * 100-year steady state: constant headcount 10, 40-year careers, replace on retirement.
 * Real wages constant (inflation 0). Observe retired vs active ownership share.
 */
export function scenarioSteady100y(inheritanceLabeling: boolean): SimulationInput {
  const contributors: Contributor[] = [];
  // 10 seats; each seat filled by successive 40-year careers from 1926
  for (let seat = 0; seat < 10; seat++) {
    for (let gen = 0; gen < 3; gen++) {
      // 1926, 1966, 2006 starts → through 2025
      const startY = 1926 + gen * 40;
      if (startY > 2025) continue;
      const endY = Math.min(2025, startY + 39);
      const id = `s${seat}g${gen}`;
      contributors.push({
        id,
        name: `Seat${seat}-G${gen}`,
        referenceAnnual: 100_000,
        cashAnnual: 100_000,
        startDate: `${startY}-01-01`,
        endDate: endY < 2025 || startY + 39 <= 2025 ? `${startY + 39}-12-31` : undefined,
        isFounder: seat === 0 && gen === 0,
      });
    }
  }
  return {
    missionId: inheritanceLabeling ? "steady-100y-inherit" : "steady-100y",
    missionName: inheritanceLabeling
      ? "4b · 100yr steady-state (inheritance labeling ON)"
      : "4a · 100yr steady-state (inheritance labeling OFF)",
    policy: defaultPolicyV01("1926-01-01"),
    startPeriod: "1926-01",
    endPeriod: "2025-12",
    contributors,
    cashInvestments: [],
    genesisImports: [],
    options: {
      referenceMode: "nominal",
      annualInflation: 0,
      realBaseYear: 1926,
      inheritanceLabeling,
    },
  };
}

/** Same org, nominal wage inflation 3%/yr vs real-normalized MU. */
export function scenarioInflationNominal(): SimulationInput {
  return {
    missionId: "infl-nominal",
    missionName: "E · Inflation NOMINAL (40yr, 3%/yr wages)",
    policy: defaultPolicyV01("1986-01-01"),
    startPeriod: "1986-01",
    endPeriod: "2025-12",
    contributors: [
      {
        id: "early",
        name: "Early career",
        referenceAnnual: 80_000,
        cashAnnual: 80_000,
        startDate: "1986-01-01",
        endDate: "2005-12-31",
      },
      {
        id: "late",
        name: "Late career",
        referenceAnnual: 80_000,
        cashAnnual: 80_000,
        startDate: "2006-01-01",
      },
    ],
    cashInvestments: [],
    genesisImports: [],
    options: {
      referenceMode: "nominal",
      annualInflation: 0.03,
      realBaseYear: 1986,
      inheritanceLabeling: false,
    },
  };
}

export function scenarioInflationReal(): SimulationInput {
  const base = scenarioInflationNominal();
  return {
    ...base,
    missionId: "infl-real",
    missionName: "E · Inflation REAL$ (40yr, same wages → 1986$)",
    options: {
      ...base.options!,
      referenceMode: "real",
      realBaseYear: 1986,
    },
  };
}

export function scenarioFlatAfterGrowth(): SimulationInput {
  const contributors: Contributor[] = [
    {
      id: "f",
      name: "Founder",
      referenceAnnual: 180_000,
      cashAnnual: 100_000,
      startDate: "2010-01-01",
      isFounder: true,
    },
  ];
  for (let y = 2010; y <= 2019; y++) {
    contributors.push({
      id: `g${y}`,
      name: `Growth ${y}`,
      referenceAnnual: 120_000,
      cashAnnual: 120_000,
      startDate: `${y}-01-01`,
    });
  }
  // flat: no new hires 2020-2029
  return {
    missionId: "flat-after",
    missionName: "7 · Flat headcount after year 10",
    policy: defaultPolicyV01("2010-01-01"),
    startPeriod: "2010-01",
    endPeriod: "2029-12",
    contributors,
    cashInvestments: [],
    genesisImports: [],
  };
}

export function scenarioRapidGrowth(): SimulationInput {
  const contributors: Contributor[] = [
    {
      id: "f",
      name: "Founder",
      referenceAnnual: 200_000,
      cashAnnual: 80_000,
      startDate: "2020-01-01",
      isFounder: true,
    },
  ];
  let n = 0;
  for (let y = 2020; y <= 2025; y++) {
    for (let i = 0; i < 3; i++) {
      n += 1;
      contributors.push({
        id: `r${n}`,
        name: `Rapid ${n}`,
        referenceAnnual: 130_000,
        cashAnnual: 130_000,
        startDate: `${y}-01-01`,
      });
    }
  }
  return {
    missionId: "rapid",
    missionName: "8 · Rapid workforce growth",
    policy: defaultPolicyV01("2020-01-01"),
    startPeriod: "2020-01",
    endPeriod: "2025-12",
    contributors,
    cashInvestments: [],
    genesisImports: [genesisLabor("f", 6, 200_000, 40_000, "2019-12")],
  };
}

export const scenarios = {
  benchmark: scenarioBenchmarkLike,
  growing10y: scenarioGrowing10y,
  mature50y: scenarioMature50y,
  steady100y: () => scenarioSteady100y(false),
  steady100yInherit: () => scenarioSteady100y(true),
  founderLeavesY5: scenarioFounderLeavesY5,
  foundersGone: scenarioAllFoundersLeaveY10,
  flatAfter: scenarioFlatAfterGrowth,
  rapid: scenarioRapidGrowth,
  fullyPaid: scenarioFullyPaid,
  underpaid: scenarioUnderpaidStartup,
  cashHeavy: scenarioCashHeavy,
  laborHeavy: scenarioLaborHeavy,
  inflNominal: scenarioInflationNominal,
  inflReal: scenarioInflationReal,
} as const;

export type ScenarioId = keyof typeof scenarios;
