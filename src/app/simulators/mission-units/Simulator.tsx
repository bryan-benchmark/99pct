"use client";

import { useMemo, useState } from "react";
import {
  explainOwnership,
  MARKET_COMP_PROXY_NOTE,
  PERSISTENCE_PRESETS,
  runSensitivity,
  runSimulation,
  scenarios,
  type DualPoolSplit,
  type PersistenceModel,
  type ScenarioId,
} from "@/mission-units";

const scenarioIds = Object.keys(scenarios) as ScenarioId[];

const POOL_PRESETS: { id: string; label: string; dual?: DualPoolSplit }[] = [
  { id: "none", label: "Single pool (EMU only)" },
  {
    id: "90-10",
    label: "Dual pool 90% current / 10% legacy",
    dual: { currentShare: 0.9, legacyShare: 0.1 },
  },
  {
    id: "85-15",
    label: "Dual pool 85% current / 15% legacy",
    dual: { currentShare: 0.85, legacyShare: 0.15 },
  },
  {
    id: "80-20",
    label: "Dual pool 80% current / 20% legacy",
    dual: { currentShare: 0.8, legacyShare: 0.2 },
  },
  {
    id: "70-30",
    label: "Dual pool 70% current / 30% legacy",
    dual: { currentShare: 0.7, legacyShare: 0.3 },
  },
];

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function fmtUnits(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function MissionUnitsSimulator() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("steady100y");
  const [persistId, setPersistId] = useState("permanent");
  const [poolId, setPoolId] = useState("none");
  const [explainId, setExplainId] = useState<string | null>(null);

  const persistModel: PersistenceModel = useMemo(() => {
    return (
      PERSISTENCE_PRESETS.find((p) => p.id === persistId)?.model ?? {
        kind: "permanent",
      }
    );
  }, [persistId]);

  const dualPool = useMemo(
    () => POOL_PRESETS.find((p) => p.id === poolId)?.dual,
    [poolId],
  );

  const input = useMemo(() => {
    const base = scenarios[scenarioId]();
    return {
      ...base,
      options: {
        ...base.options,
        persistence: persistModel,
        dualPool,
        currentWindowYears: 5,
      },
    };
  }, [scenarioId, persistModel, dualPool]);

  const result = useMemo(() => runSimulation(input), [input]);

  const riskSweep = useMemo(
    () =>
      runSensitivity(input, runSimulation, "atRiskLaborMultiplier", [
        1, 1.5, 2, 3,
      ]),
    [input],
  );

  const economicPeople = Object.values(result.economic.byContributor).sort(
    (a, b) => b.economicPercent - a.economicPercent,
  );

  const explain = explainId
    ? explainOwnership(result, explainId, result.final.period)
    : null;

  const halfLife = result.persistence[0]?.halfLifeYears ?? null;

  return (
    <div className="space-y-10">
      <p className="text-sm text-[var(--muted)]">{MARKET_COMP_PROXY_NOTE}</p>
      <p className="text-sm text-[var(--body)]">
        <strong className="text-[var(--ink)]">V0.2:</strong> MU stay permanent.
        Economic force = derived EMU (persistence) and/or dual current/legacy
        pools. Governance ≠ economics (not simulated). Default reference mode is{" "}
        <code className="mono">real</code>.
      </p>

      <section className="space-y-3">
        <label className="block font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
          Scenario
          <select
            className="mt-1 block w-full max-w-xl border border-[var(--line)] bg-white px-2 py-2 text-[var(--ink)]"
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value as ScenarioId);
              setExplainId(null);
            }}
          >
            {scenarioIds.map((id) => (
              <option key={id} value={id}>
                {scenarios[id]().missionName}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
          Persistence (economic force on historical MU)
          <select
            className="mt-1 block w-full max-w-xl border border-[var(--line)] bg-white px-2 py-2 text-[var(--ink)]"
            value={persistId}
            onChange={(e) => setPersistId(e.target.value)}
          >
            {PERSISTENCE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
          Dual pool (optional)
          <select
            className="mt-1 block w-full max-w-xl border border-[var(--line)] bg-white px-2 py-2 text-[var(--ink)]"
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
          >
            {POOL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-[var(--muted)]">
          Mode: {result.options.referenceMode}
          {result.options.annualInflation
            ? ` · inflation ${(result.options.annualInflation * 100).toFixed(1)}%/yr`
            : ""}
          {" · economic model: "}
          <code className="mono">{result.economic.modelLabel}</code>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Institution memory — % economics by contribution age
        </h2>
        <pre className="mono mt-3 text-sm leading-relaxed">
          {result.economic.ageBands
            .map((b) => `${b.label.padEnd(14)} ${fmtPct(b.percent)}`)
            .join("\n")}
        </pre>
        <div className="mt-4 space-y-2">
          {result.economic.ageBands.map((b) => (
            <div key={b.id}>
              <div className="flex justify-between text-xs text-[var(--muted)]">
                <span>{b.label}</span>
                <span className="mono">{fmtPct(b.percent)}</span>
              </div>
              <div className="mt-1 h-2 w-full bg-[var(--line)]">
                <div
                  className="h-2 bg-[var(--ink)]"
                  style={{ width: `${Math.min(100, b.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Economic ownership (derived)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Not the same as historical MU %. MU ledger is immutable; this table is
          EMU / dual-pool weight.
          {halfLife != null
            ? ` · MU half-life under permanent issuance ≈ ${halfLife.toFixed(1)} yr`
            : ""}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] font-[family-name:var(--font-sans)] text-[var(--muted)]">
                <th className="py-2 pr-2 font-medium">Person</th>
                <th className="py-2 pr-2 font-medium">MU</th>
                <th className="py-2 pr-2 font-medium">EMU / wt</th>
                <th className="py-2 pr-2 font-medium">Econ %</th>
                <th className="py-2 pr-2 font-medium">MU %</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {economicPeople.slice(0, 24).map((row) => {
                const id =
                  Object.entries(result.economic.byContributor).find(
                    ([, v]) => v === row,
                  )?.[0] ?? "";
                const muPct = result.final.byContributor[id]?.percent ?? 0;
                return (
                  <tr key={id} className="border-b border-[var(--line)]">
                    <td className="py-2 pr-2">{row.name}</td>
                    <td className="mono py-2 pr-2">{fmtUnits(row.mu)}</td>
                    <td className="mono py-2 pr-2">{fmtUnits(row.emu)}</td>
                    <td className="mono py-2 pr-2">
                      {fmtPct(row.economicPercent)}
                    </td>
                    <td className="mono py-2 pr-2 text-[var(--muted)]">
                      {fmtPct(muPct)}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-[var(--link)] underline"
                        onClick={() => setExplainId(id)}
                      >
                        MU why?
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">MU cohorts (historical ledger)</h2>
        <pre className="mono mt-3 text-sm leading-relaxed">
{`Active (MU holders active now)  ${fmtPct(result.cohorts.activePct)}
Retired                          ${fmtPct(result.cohorts.retiredPct)}
Inherited label                  ${fmtPct(result.cohorts.inheritedPct)}
MU earned last 5y                ${fmtPct(result.cohorts.recent5Pct)}
MU earned >10y ago               ${fmtPct(result.cohorts.historicalPct)}`}
        </pre>
      </section>

      {explain && explainId ? (
        <section>
          <h2 className="text-xl font-semibold">
            MU ledger — {result.final.byContributor[explainId]?.name}
          </h2>
          <pre className="mono mt-3 max-h-80 overflow-auto text-xs leading-relaxed">
            {explain.lines
              .slice(0, 40)
              .map(
                (l) =>
                  `${l.period}  ${l.type.padEnd(14)}  ${fmtUnits(l.units).padStart(10)}  ${l.explanation}`,
              )
              .join("\n")}
            {explain.lines.length > 40 ? "\n… truncated …\n" : "\n"}
            {`
MU total ${fmtUnits(explain.total)} / ${fmtUnits(explain.missionTotal)} = ${fmtPct(explain.percent)}`}
          </pre>
        </section>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold">Sensitivity — at-risk ×</h2>
        <pre className="mono mt-3 overflow-x-auto text-xs">
          {riskSweep
            .map((row) => {
              const parts = Object.entries(row.percents)
                .slice(0, 6)
                .map(([id, pct]) => `${id}:${pct.toFixed(1)}%`)
                .join("  ");
              return `risk×${row.value}  ${parts}`;
            })
            .join("\n")}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Falsification questions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--body)]">
          <li>
            Permanent vs exp-10 on 100yr: does active economics recover from
            ~20%?
          </li>
          <li>
            Age-band chart: does the institution&apos;s memory look coherent?
          </li>
          <li>
            Dual 85/15: can legacy stay forever without owning the future?
          </li>
          <li>Cliff vs exponential: which fails less under growth/departure?</li>
        </ul>
      </section>
    </div>
  );
}
