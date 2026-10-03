/** Mission Units v0.1 — domain types. Proposed / Experimental. Not Canonical. */

export type ContributionType =
  | "LABOR"
  | "AT_RISK_LABOR"
  | "CASH"
  | "EXPENSE"
  | "REVERSAL";

export type EventStatus = "DRAFT" | "PENDING" | "FINALIZED" | "VOIDED";

export type ReferenceMode = "nominal" | "real";

export type MissionEconomicPolicy = {
  version: string;
  epoch: "monthly";
  laborMultiplier: number;
  atRiskLaborMultiplier: number;
  cashRiskMultiplier: number;
  expenseRiskMultiplier: number;
  departurePolicy: "retain_finalized_units";
  effectiveAt: string; // YYYY-MM-DD
};

/**
 * V0.1 hypothesis (experimental, not doctrine):
 * Prospective market compensation is a useful deterministic proxy for baseline
 * labor contribution. It is NOT asserted to equal mission value.
 */
export const MARKET_COMP_PROXY_NOTE =
  "MISSION_UNITS uses prospective market compensation as a deterministic proxy for baseline labor contribution. Experimental simplification — not a claim that market compensation equals mission value. Prefer real (constant purchasing-power) MU across decades.";

export type Contributor = {
  id: string;
  name: string;
  /** Annual fair-market reference compensation in start-year dollars (USD). */
  referenceAnnual: number;
  /** Annual cash compensation in start-year dollars (USD). */
  cashAnnual: number;
  startDate: string;
  endDate?: string;
  /** Founder flag for cohort reporting only. */
  isFounder?: boolean;
  /** If set, this id is an estate/heir account (no labor); used when inheritance labeling is on. */
  heirOf?: string;
};

/**
 * Genesis is an IMPORT of recognized contribution types earned before ledger
 * activation — not an arbitrary mint of genesisUnits.
 */
export type GenesisImport = {
  contributorId: string;
  /** Decompose historical labor into months × annual reference/cash. */
  historicalLabor?: {
    months: number;
    referenceAnnual: number;
    cashAnnual: number;
    /** Last month of historical period YYYY-MM */
    endPeriod: string;
  };
  cash?: { amount: number; date: string; explanation: string };
  expenses?: { amount: number; date: string; explanation: string }[];
};

export type ContributionEvent = {
  id: string;
  missionId: string;
  contributorId: string;
  occurredAt: string;
  period: string;
  type: ContributionType;
  referenceValue: number;
  multiplier: number;
  units: number;
  explanation: string;
  status: EventStatus;
  policyVersion: string;
  /** Required when type === REVERSAL */
  reversesEventId?: string;
  /** When this event replaces a reversed one */
  replacementForEventId?: string;
};

export type CashInvestment = {
  id: string;
  contributorId: string;
  date: string;
  amount: number;
  explanation: string;
};

export type SimulationOptions = {
  /** Prefer real for multi-decade; nominal kept for inflation falsification. */
  referenceMode: ReferenceMode;
  annualInflation: number;
  realBaseYear: number;
  inheritanceLabeling: boolean;
  /** V0.2: how historical MU translate into current economic force. */
  persistence?: import("./persistence").PersistenceModel;
  /**
   * V0.2 dual-pool experiment. If set, economics = currentShare×(recent EMU)
   * + legacyShare×(all MU). Shares should sum to 1.
   */
  dualPool?: import("./persistence").DualPoolSplit;
  /** Years defining "current/recent" for dual-pool current side. Default 5. */
  currentWindowYears?: number;
};

export type SimulationInput = {
  missionId: string;
  missionName: string;
  policy: MissionEconomicPolicy;
  contributors: Contributor[];
  cashInvestments: CashInvestment[];
  startPeriod: string;
  endPeriod: string;
  genesisImports?: GenesisImport[];
  options?: Partial<SimulationOptions>;
  /** Optional mid-sim policy change (prospective only). */
  policyChange?: { effectivePeriod: string; policy: MissionEconomicPolicy };
};

export type OwnershipSnapshot = {
  period: string;
  totalUnits: number;
  byContributor: Record<
    string,
    { units: number; percent: number; name: string }
  >;
};

export type CohortReport = {
  activePct: number;
  retiredPct: number;
  inheritedPct: number;
  founderPct: number;
  recent5Pct: number;
  recent10Pct: number;
  historicalPct: number;
};

export type PersistenceMetrics = {
  contributorId: string;
  name: string;
  units: number;
  percent: number;
  missionAnnualNewMu: number;
  projectedPct1y: number;
  projectedPct5y: number;
  projectedPct10y: number;
  /** Years until % halves if contributor earns 0 and issuance stays at recent rate. null if never. */
  halfLifeYears: number | null;
};

export type SimulationResult = {
  events: ContributionEvent[];
  snapshots: OwnershipSnapshot[];
  /** Historical MU ownership (permanent ledger view) — v0.1 formula. */
  final: OwnershipSnapshot;
  options: SimulationOptions;
  cohorts: CohortReport;
  persistence: PersistenceMetrics[];
  /** V0.2 derived economic ownership from EMU / dual-pool. */
  economic: EconomicOwnership;
};

export type AgeBandShare = {
  id: string;
  label: string;
  percent: number;
};

export type EconomicOwnership = {
  modelLabel: string;
  totalEmu: number;
  byContributor: Record<
    string,
    { mu: number; emu: number; economicPercent: number; name: string }
  >;
  ageBands: AgeBandShare[];
  dualPool?: {
    currentShare: number;
    legacyShare: number;
    currentWindowYears: number;
  };
};
