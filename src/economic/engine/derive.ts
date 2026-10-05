import { addMcu, parseMcu } from "../quantity";
import { foldState } from "./evaluate";
import type { EconomicEvent } from "../model";

export function mcuTotal(events: EconomicEvent[], beneficiaryRef: string) {
  const state = foldState(events);
  let total = BigInt(0);
  for (const grant of state.grants.values()) {
    if (grant.beneficiaryRef === beneficiaryRef) total = parseMcu(addMcu(total, grant.amount));
  }
  return total;
}

export function mcuHistory(events: EconomicEvent[], beneficiaryRef: string) {
  return events.filter((event) => (event.eventType === "mcu_granted" || event.eventType === "mcu_adjusted" || event.eventType === "bounty_reward_granted")
    && event.payload.beneficiaryRef === beneficiaryRef);
}

export function bountyState(events: EconomicEvent[], bountyRef: string, beneficiaryRef: string) {
  const state = foldState(events);
  const rewarded = events.some((event) => event.eventType === "bounty_reward_granted" && event.payload.bountyRef === bountyRef && event.payload.beneficiaryRef === beneficiaryRef);
  if (rewarded) return "rewarded" as const;
  if ([...state.completions].some((key) => key.startsWith(`${bountyRef}:${beneficiaryRef}:`))) return "recognized" as const;
  if (state.participants.has(`${bountyRef}:${beneficiaryRef}`)) return "participating" as const;
  if (state.bounties.has(bountyRef)) return "published" as const;
  return "absent" as const;
}

export function rewardIssued(events: EconomicEvent[], rewardKey: string) {
  return foldState(events).rewardKeys.has(rewardKey);
}
