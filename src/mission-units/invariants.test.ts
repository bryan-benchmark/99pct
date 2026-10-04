/**
 * Executable invariants for MISSION_UNITS_V0.1.
 * Build must fail if any assertion fails.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  almostEqual,
  assertNoManualPercentApi,
  correctEvent,
  generateLaborEvents,
  makeEvent,
  ownershipFromEvents,
  reverseEvent,
  runSimulation,
  defaultOptions,
} from "./engine";
import { defaultPolicyV01 } from "./policy";
import { persistenceWeight } from "./persistence";
import { scenarioBenchmarkLike } from "./scenarios";
import type { ContributionEvent, Contributor, SimulationInput } from "./types";
import { MARKET_COMP_PROXY_NOTE } from "./types";

function miniOrg(overrides?: Partial<SimulationInput>): SimulationInput {
  return {
    missionId: "t",
    missionName: "test",
    policy: defaultPolicyV01("2024-01-01"),
    startPeriod: "2024-01",
    endPeriod: "2024-03",
    contributors: [
      {
        id: "a",
        name: "A",
        referenceAnnual: 120_000,
        cashAnnual: 120_000,
        startDate: "2024-01-01",
      },
    ],
    cashInvestments: [],
    genesisImports: [],
    ...overrides,
  };
}

function percents(input: SimulationInput): Record<string, number> {
  const r = runSimulation(input);
  const out: Record<string, number> = {};
  for (const [id, row] of Object.entries(r.final.byContributor)) {
    out[id] = row.percent;
  }
  return out;
}

describe("MISSION_UNITS_V0.1 invariants", () => {
  it("documents market compensation as experimental proxy", () => {
    assert.match(MARKET_COMP_PROXY_NOTE, /not a claim that market compensation equals mission value/i);
  });

  it("SPLIT INVARIANCE: one event vs twelve equal parts → same ownership", () => {
    const policy = defaultPolicyV01();
    const contributors: Contributor[] = [
      {
        id: "a",
        name: "A",
        referenceAnnual: 0,
        cashAnnual: 0,
        startDate: "2024-01-01",
      },
      {
        id: "b",
        name: "B",
        referenceAnnual: 0,
        cashAnnual: 0,
        startDate: "2024-01-01",
      },
    ];
    const one: ContributionEvent[] = [
      makeEvent({
        id: "1",
        missionId: "t",
        contributorId: "a",
        occurredAt: "2024-01-01",
        period: "2024-01",
        type: "LABOR",
        referenceValue: 12_000,
        multiplier: 1,
        explanation: "one",
        status: "FINALIZED",
        policyVersion: policy.version,
      }),
    ];
    const twelve: ContributionEvent[] = Array.from({ length: 12 }, (_, i) =>
      makeEvent({
        id: `p${i}`,
        missionId: "t",
        contributorId: "a",
        occurredAt: "2024-01-01",
        period: "2024-01",
        type: "LABOR",
        referenceValue: 1_000,
        multiplier: 1,
        explanation: "part",
        status: "FINALIZED",
        policyVersion: policy.version,
      }),
    );
    const o1 = ownershipFromEvents(one, contributors, "x");
    const o2 = ownershipFromEvents(twelve, contributors, "x");
    assert.equal(o1.byContributor.a!.units, o2.byContributor.a!.units);
  });

  it("SCALE INVARIANCE: ×10 all contributions → same percentages", () => {
    const base = miniOrg({
      contributors: [
        {
          id: "a",
          name: "A",
          referenceAnnual: 100_000,
          cashAnnual: 100_000,
          startDate: "2024-01-01",
        },
        {
          id: "b",
          name: "B",
          referenceAnnual: 50_000,
          cashAnnual: 50_000,
          startDate: "2024-01-01",
        },
      ],
    });
    const p1 = percents(base);
    const scaled = {
      ...base,
      contributors: base.contributors.map((c) => ({
        ...c,
        referenceAnnual: c.referenceAnnual * 10,
        cashAnnual: c.cashAnnual * 10,
      })),
    };
    const p2 = percents(scaled);
    assert.ok(almostEqual(p1.a!, p2.a!, 1e-4));
    assert.ok(almostEqual(p1.b!, p2.b!, 1e-4));
  });

  it("ORDER INVARIANCE: shuffling finalized events → same ownership", () => {
    const r = runSimulation(miniOrg());
    const shuffled = [...r.events].sort(() => Math.random() - 0.5);
    // Rebuild with same contributors
    const c = miniOrg().contributors;
    const a = ownershipFromEvents(r.events, c, "t");
    const b = ownershipFromEvents(shuffled, c, "t");
    assert.ok(almostEqual(a.totalUnits, b.totalUnits));
    assert.ok(almostEqual(a.byContributor.a!.percent, b.byContributor.a!.percent));
  });

  it("EQUAL TREATMENT: identical inputs → identical MU", () => {
    const r = runSimulation(
      miniOrg({
        contributors: [
          {
            id: "a",
            name: "A",
            referenceAnnual: 120_000,
            cashAnnual: 120_000,
            startDate: "2024-01-01",
          },
          {
            id: "b",
            name: "B",
            referenceAnnual: 120_000,
            cashAnnual: 120_000,
            startDate: "2024-01-01",
          },
        ],
      }),
    );
    assert.ok(
      almostEqual(
        r.final.byContributor.a!.units,
        r.final.byContributor.b!.units,
      ),
    );
  });

  it("FULL PAY → zero AT_RISK_LABOR", () => {
    const r = runSimulation(miniOrg());
    const risk = r.events.filter((e) => e.type === "AT_RISK_LABOR");
    assert.equal(risk.length, 0);
  });

  it("UNDERPAY → exactly unpaid × atRisk multiplier", () => {
    const policy = defaultPolicyV01();
    policy.atRiskLaborMultiplier = 2;
    const c: Contributor = {
      id: "a",
      name: "A",
      referenceAnnual: 120_000,
      cashAnnual: 60_000,
      startDate: "2024-01-01",
    };
    const ev = generateLaborEvents(
      "t",
      c,
      "2024-01",
      policy,
      defaultOptions({ annualInflation: 0 }),
      2024,
    );
    const labor = ev.find((e) => e.type === "LABOR")!;
    const risk = ev.find((e) => e.type === "AT_RISK_LABOR")!;
    assert.ok(labor);
    assert.ok(risk);
    assert.ok(almostEqual(risk.referenceValue, 5_000)); // (120k-60k)/12
    assert.ok(almostEqual(risk.units, 5_000 * 2));
    // LABOR still full reference — unpaid not subtracted from labor (no double-count)
    assert.ok(almostEqual(labor.units, 10_000));
  });

  it("OVERPAY → no negative risk units", () => {
    const c: Contributor = {
      id: "a",
      name: "A",
      referenceAnnual: 100_000,
      cashAnnual: 200_000,
      startDate: "2024-01-01",
    };
    const ev = generateLaborEvents(
      "t",
      c,
      "2024-01",
      defaultPolicyV01(),
      defaultOptions(),
      2024,
    );
    assert.equal(ev.filter((e) => e.type === "AT_RISK_LABOR").length, 0);
    assert.ok(ev.every((e) => e.units >= 0));
  });

  it("DEPARTURE preserves finalized units and stops future generation", () => {
    const r = runSimulation(
      miniOrg({
        endPeriod: "2024-06",
        contributors: [
          {
            id: "a",
            name: "A",
            referenceAnnual: 120_000,
            cashAnnual: 120_000,
            startDate: "2024-01-01",
            endDate: "2024-03-31",
          },
        ],
      }),
    );
    const after = r.events.filter(
      (e) => e.contributorId === "a" && e.period > "2024-03" && e.type === "LABOR",
    );
    assert.equal(after.length, 0);
    assert.ok(r.final.byContributor.a!.units > 0);
  });

  it("PROSPECTIVITY: policy change does not alter earlier finalized event multipliers", () => {
    const r = runSimulation(
      miniOrg({
        endPeriod: "2024-06",
        policyChange: {
          effectivePeriod: "2024-04",
          policy: {
            ...defaultPolicyV01(),
            version: "0.1-b",
            laborMultiplier: 3,
          },
        },
      }),
    );
    const early = r.events.filter(
      (e) => e.type === "LABOR" && e.period <= "2024-03",
    );
    const late = r.events.filter(
      (e) => e.type === "LABOR" && e.period >= "2024-04",
    );
    assert.ok(early.every((e) => e.multiplier === 1 && e.policyVersion === "0.1"));
    assert.ok(late.every((e) => e.multiplier === 3 && e.policyVersion === "0.1-b"));
  });

  it("CORRECTION: reversal + replacement keeps original event visible", () => {
    const original = makeEvent({
      id: "orig",
      missionId: "t",
      contributorId: "a",
      occurredAt: "2024-01-01",
      period: "2024-01",
      type: "LABOR",
      referenceValue: 10_000,
      multiplier: 1,
      explanation: "wrong",
      status: "FINALIZED",
      policyVersion: "0.1",
    });
    const [rev, fix] = correctEvent(original, {
      missionId: "t",
      contributorId: "a",
      occurredAt: "2024-01-01",
      period: "2024-01",
      type: "LABOR",
      referenceValue: 8_000,
      multiplier: 1,
      explanation: "corrected",
      policyVersion: "0.1",
    });
    assert.equal(original.status, "FINALIZED");
    assert.equal(rev.type, "REVERSAL");
    assert.equal(rev.reversesEventId, "orig");
    assert.equal(rev.units, -10_000);
    assert.equal(fix.replacementForEventId, "orig");
    assert.equal(fix.units, 8_000);
    const net = ownershipFromEvents(
      [original, rev, fix],
      [
        {
          id: "a",
          name: "A",
          referenceAnnual: 0,
          cashAnnual: 0,
          startDate: "2024-01-01",
        },
      ],
      "t",
    );
    assert.ok(almostEqual(net.byContributor.a!.units, 8_000));
  });

  it("REVERSAL requires reversesEventId; no unrestricted mint", () => {
    assert.throws(() =>
      makeEvent({
        id: "x",
        missionId: "t",
        contributorId: "a",
        occurredAt: "2024-01-01",
        period: "2024-01",
        type: "REVERSAL",
        referenceValue: 0,
        multiplier: 0,
        units: 400_000,
        explanation: "founder mint",
        status: "FINALIZED",
        policyVersion: "0.1",
      }),
    );
  });

  it("NO MANUAL % path", () => {
    assertNoManualPercentApi();
    const r = runSimulation(miniOrg());
    assert.ok(typeof r.final.byContributor.a!.percent === "number");
  });

  it("GENESIS is import of historical labor/cash — not arbitrary genesisUnits", () => {
    const r = runSimulation(scenarioBenchmarkLike());
    const gen = r.events.filter((e) => e.id.startsWith("gen"));
    assert.ok(gen.length > 0);
    assert.ok(gen.every((e) => e.type === "LABOR" || e.type === "AT_RISK_LABOR" || e.type === "CASH" || e.type === "EXPENSE"));
  });

  it("TIME INVARIANCE: identical total contribution across periods → same units", () => {
    // Three months full pay 10k/mo vs conceptually same annual — compare unit totals for equal months
    const r3 = runSimulation(miniOrg({ endPeriod: "2024-03" }));
    const r1 = runSimulation(miniOrg({ endPeriod: "2024-01" }));
    assert.ok(
      almostEqual(
        r3.final.byContributor.a!.units,
        r1.final.byContributor.a!.units * 3,
        1e-4,
      ),
    );
  });

  it("FINALIZED events are not mutated by reverseEvent", () => {
    const original = makeEvent({
      id: "o",
      missionId: "t",
      contributorId: "a",
      occurredAt: "2024-01-01",
      period: "2024-01",
      type: "CASH",
      referenceValue: 1000,
      multiplier: 2,
      explanation: "cash",
      status: "FINALIZED",
      policyVersion: "0.1",
    });
    const copy = { ...original };
    reverseEvent(original, "fix");
    assert.deepEqual(original, copy);
  });
});

describe("MISSION_UNITS_V0.2 persistence", () => {
  it("permanent model: economic % equals MU %", () => {
    const r = runSimulation(
      miniOrg({
        options: { persistence: { kind: "permanent" } },
        contributors: [
          {
            id: "a",
            name: "A",
            referenceAnnual: 120_000,
            cashAnnual: 120_000,
            startDate: "2024-01-01",
          },
          {
            id: "b",
            name: "B",
            referenceAnnual: 60_000,
            cashAnnual: 60_000,
            startDate: "2024-01-01",
          },
        ],
      }),
    );
    assert.ok(
      almostEqual(
        r.economic.byContributor.a!.economicPercent,
        r.final.byContributor.a!.percent,
        1e-4,
      ),
    );
  });

  it("MU ledger unchanged when persistence applied (no silent shrink)", () => {
    const base = miniOrg({ endPeriod: "2024-06" });
    const perm = runSimulation({
      ...base,
      options: { persistence: { kind: "permanent" } },
    });
    const exp = runSimulation({
      ...base,
      options: { persistence: { kind: "exponential", halfLifeYears: 2 } },
    });
    assert.ok(
      almostEqual(
        perm.final.byContributor.a!.units,
        exp.final.byContributor.a!.units,
      ),
    );
    assert.ok(exp.economic.byContributor.a!.emu <= perm.economic.byContributor.a!.emu + 1e-6);
  });

  it("exponential persistenceWeight halves at half-life", () => {
    assert.ok(
      almostEqual(
        persistenceWeight(10, { kind: "exponential", halfLifeYears: 10 }),
        0.5,
        1e-9,
      ),
    );
  });

  it("hard expiration zeros force after cliff", () => {
    assert.equal(persistenceWeight(9.9, { kind: "hard", years: 10 }), 1);
    assert.equal(persistenceWeight(10, { kind: "hard", years: 10 }), 0);
  });

  it("dual pool shares sum to ~100% economics", () => {
    const r = runSimulation({
      ...miniOrg({
        endPeriod: "2024-06",
        contributors: [
          {
            id: "a",
            name: "A",
            referenceAnnual: 120_000,
            cashAnnual: 120_000,
            startDate: "2024-01-01",
          },
          {
            id: "b",
            name: "B",
            referenceAnnual: 60_000,
            cashAnnual: 60_000,
            startDate: "2024-01-01",
          },
        ],
      }),
      options: {
        persistence: { kind: "permanent" },
        dualPool: { currentShare: 0.85, legacyShare: 0.15 },
      },
    });
    const sum = Object.values(r.economic.byContributor).reduce(
      (a, row) => a + row.economicPercent,
      0,
    );
    assert.ok(almostEqual(sum, 100, 1e-3));
  });
});
