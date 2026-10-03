import type { MissionEconomicPolicy } from "./types";

export const defaultPolicyV01 = (
  effectiveAt = "2024-01-01",
): MissionEconomicPolicy => ({
  version: "0.1",
  epoch: "monthly",
  laborMultiplier: 1,
  atRiskLaborMultiplier: 2,
  cashRiskMultiplier: 2,
  expenseRiskMultiplier: 2,
  departurePolicy: "retain_finalized_units",
  effectiveAt,
});
