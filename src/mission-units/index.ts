export {
  runSimulation,
  explainOwnership,
  listPeriods,
  reverseEvent,
  correctEvent,
  assertNoManualPercentApi,
  almostEqual,
  defaultOptions,
} from "./engine";
export { defaultPolicyV01 } from "./policy";
export { scenarios, type ScenarioId } from "./scenarios";
export { runSensitivity, ownershipHalfLifeYears } from "./metrics";
export {
  PERSISTENCE_PRESETS,
  persistenceWeight,
  contributionAgeYears,
  type PersistenceModel,
  type DualPoolSplit,
} from "./persistence";
export { computeEconomicOwnership } from "./economics";
export {
  computeOutcomeMu,
  quarterlyReferenceFromHourly,
  periodReferenceFromHourly,
  BENCHMARK_SCORECARD_V01,
  PILOT_SIX_MONTH_REFERENCE,
} from "./outcome";
export type {
  OutcomeMuInput,
  OutcomeMuResult,
  ScorecardPolicy,
  KpiPolicy,
  KpiFact,
  KpiAttainment,
} from "./outcome";
export { MARKET_COMP_PROXY_NOTE } from "./types";
export type * from "./types";
