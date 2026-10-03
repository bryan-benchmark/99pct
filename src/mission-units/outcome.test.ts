import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeOutcomeMu,
  quarterlyReferenceFromHourly,
  periodReferenceFromHourly,
  BENCHMARK_SCORECARD_V01,
  PILOT_SIX_MONTH_REFERENCE,
  type ScorecardPolicy,
} from "./outcome";

const policy = BENCHMARK_SCORECARD_V01;

/** Same six-month facts regardless of which quarter the closes landed in. */
const illustrativeFacts = [
  { id: "economic-growth", kind: "ratio" as const, measured: 120_000 },
  { id: "qualified-buying-processes", kind: "ratio" as const, measured: 18 },
  { id: "growth-leverage", kind: "milestone" as const, levelAchieved: "met" },
];

describe("OUTCOME_MISSION_UNITS hardening", () => {
  it("hours define reference only: $75×10×13 = $9750 (dashboard)", () => {
    assert.equal(quarterlyReferenceFromHourly(75, 10), 9750);
  });

  it("six-month pilot reference is authoritative: $75×10×26 = $19500", () => {
    assert.equal(periodReferenceFromHourly(75, 10, 26), 19500);
    assert.equal(PILOT_SIX_MONTH_REFERENCE, 19500);
  });

  it("scorecard targets are six-month ($100k / 12), not quarterly", () => {
    const growth = policy.kpis.find((k) => k.id === "economic-growth")!;
    const qbp = policy.kpis.find((k) => k.id === "qualified-buying-processes")!;
    assert.equal(growth.kind, "ratio");
    assert.equal(qbp.kind, "ratio");
    if (growth.kind === "ratio") assert.equal(growth.target, 100_000);
    if (qbp.kind === "ratio") assert.equal(qbp.target, 12);
    assert.equal(policy.version, "benchmark-6m-v0.1");
  });

  it("derives attainment from raw facts — nobody types 125%", () => {
    // 120k/100k = 1.2, 18/12 = 1.5, met = 1.0 → 0.5*1.2 + 0.3*1.5 + 0.2*1 = 1.25
    const r = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: illustrativeFacts,
    });
    assert.equal(r.policyVersion, "benchmark-6m-v0.1");
    assert.equal(r.weightedScore, 1.25);
    assert.equal(r.cappedScore, 1.25);
    assert.equal(r.outcomeValue, 24375); // 19500 × 1.25
    assert.equal(r.normalMu, 24375);
    assert.equal(r.uncompensated, 24375);
    assert.equal(r.atRiskMu, 24375);
    assert.equal(r.totalMu, 48750);
  });

  it("Q1-heavy and Q2-heavy closes with same totals → same economic-growth attainment", () => {
    const allInQ2 = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 100_000 }, // $0 then $100k
        { id: "qualified-buying-processes", kind: "ratio", measured: 12 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: "met" },
      ],
    });
    const splitEven = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 100_000 }, // $50k + $50k
        { id: "qualified-buying-processes", kind: "ratio", measured: 12 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: "met" },
      ],
    });
    assert.equal(
      allInQ2.kpiAttainments.find((k) => k.id === "economic-growth")!
        .cappedAttainment,
      splitEven.kpiAttainments.find((k) => k.id === "economic-growth")!
        .cappedAttainment,
    );
    assert.equal(allInQ2.totalMu, splitEven.totalMu);
  });

  it("contingent commission does not reduce at-risk MU (guaranteed cash only)", () => {
    const r = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: illustrativeFacts,
    });
    assert.equal(r.totalMu, 48750);
  });

  it("guaranteed retainer reduces at-risk exposure only", () => {
    const r = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 5000,
      facts: illustrativeFacts,
    });
    assert.equal(r.outcomeValue, 24375);
    assert.equal(r.normalMu, 24375);
    assert.equal(r.uncompensated, 19375);
    assert.equal(r.atRiskMu, 19375);
    assert.equal(r.totalMu, 43750);
  });

  it("caps each KPI at 200% before weighting — one KPI cannot alone exceed 100% of score", () => {
    const r = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 400_000 }, // 4.0 → 2.0
        { id: "qualified-buying-processes", kind: "ratio", measured: 0 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: null },
      ],
    });
    const growth = r.kpiAttainments.find((k) => k.id === "economic-growth")!;
    assert.equal(growth.rawAttainment, 4);
    assert.equal(growth.cappedAttainment, 2);
    assert.equal(r.weightedScore, 1);
    assert.equal(r.cappedScore, 1);
    assert.equal(r.outcomeValue, 19500);
  });

  it("above-target overall score requires multi-dimension value", () => {
    const oneDim = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 400_000 },
        { id: "qualified-buying-processes", kind: "ratio", measured: 0 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: null },
      ],
    });
    assert.ok(oneDim.cappedScore <= 1);

    const twoDim = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 400_000 },
        { id: "qualified-buying-processes", kind: "ratio", measured: 24 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: null },
      ],
    });
    assert.equal(twoDim.weightedScore, 1.6);
    assert.ok(twoDim.cappedScore > 1);
  });

  it("growth leverage is mechanical: only prospective acceptance levels", () => {
    const unmet = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 100_000 },
        { id: "qualified-buying-processes", kind: "ratio", measured: 12 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: null },
      ],
    });
    assert.equal(
      unmet.kpiAttainments.find((k) => k.id === "growth-leverage")!
        .cappedAttainment,
      0,
    );

    const stretch = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 100_000 },
        { id: "qualified-buying-processes", kind: "ratio", measured: 12 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: "stretch" },
      ],
    });
    assert.equal(
      stretch.kpiAttainments.find((k) => k.id === "growth-leverage")!
        .cappedAttainment,
      1.5,
    );

    assert.throws(() =>
      computeOutcomeMu({
        policy,
        periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
        guaranteedRoleCash: 0,
        facts: [
          { id: "economic-growth", kind: "ratio", measured: 100_000 },
          { id: "qualified-buying-processes", kind: "ratio", measured: 12 },
          {
            id: "growth-leverage",
            kind: "milestone",
            levelAchieved: "felt-good",
          },
        ],
      }),
    );
  });

  it("overall scoreCap still bounds extreme multi-KPI performance", () => {
    const r = computeOutcomeMu({
      policy,
      periodReferenceValue: PILOT_SIX_MONTH_REFERENCE,
      guaranteedRoleCash: 0,
      facts: [
        { id: "economic-growth", kind: "ratio", measured: 400_000 },
        { id: "qualified-buying-processes", kind: "ratio", measured: 40 },
        { id: "growth-leverage", kind: "milestone", levelAchieved: "stretch" },
      ],
    });
    assert.equal(r.weightedScore, 1.9);
    assert.equal(r.cappedScore, 1.9);
  });

  it("rejects KPI weights that do not sum to 1", () => {
    const bad: ScorecardPolicy = {
      version: "bad",
      effectiveAt: "2026-01-01",
      scoreCap: 2,
      kpis: [
        {
          kind: "ratio",
          id: "a",
          weight: 0.5,
          target: 1,
          attainmentCap: 2,
        },
      ],
    };
    assert.throws(() =>
      computeOutcomeMu({
        policy: bad,
        periodReferenceValue: 1000,
        guaranteedRoleCash: 0,
        facts: [{ id: "a", kind: "ratio", measured: 1 }],
      }),
    );
  });
});
