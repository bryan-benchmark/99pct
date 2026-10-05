# Infrastructure Drip

Updated: 2026-10-04

## Purpose

The Infrastructure Drip makes shared infrastructure contribution visible and sustainable by protocol rather than by donation, hidden rent extraction, or outside-equity control.

It has two separate rails:

1. **MCU rail** — records shared infrastructure contribution.
2. **cash rail** — eventually pays real dollar-denominated shared costs.

They must never be collapsed into one asset.

## MCU rail

A normal human Contribution grant remains whole.

Example:

```text
Primary human rule grants:        100.000000 MCU
Infrastructure policy at 1%:        1.000000 MCU allocation
```

The contributor receives all 100 MCU.

The infrastructure allocation is additional.

It is recorded as a distinct mission-level event, not as a fake human grant.

### Initial production policy

- policy id: `infrastructure-drip`
- version: 1
- rate: 100 basis points
- protocol max: 200 basis points
- initial dependency: 99pct Infrastructure Mission
- dependency weight: 10,000 basis points = 100%

The policy definition is immutable once published.

A later rate or dependency change is a new version.

### Event semantic

Recommended event:

`infrastructure_mcu_allocated`

Minimum provenance:

- source Mission;
- source human-grant event id;
- source Contribution ref where applicable;
- dependency Mission ref;
- amount in MCU minor units;
- infrastructure-policy id/version;
- stable allocation key.

The allocation belongs to the source Mission's hash-linked stream.

It is checkpointed with that stream.

### Not a treasury token

The recipient Mission does not receive a transferable token balance.

There is no:

- transfer;
- withdrawal;
- cash conversion;
- equity conversion;
- arbitrary admin payout.

Human maintainers of shared infrastructure receive their own MCUs only through normal Contribution → recognition → grant.

Infrastructure-allocation totals are a public accounting signal that shared infrastructure created value for downstream Missions.

## Deterministic math

No floating point.

For primary amount `P` and rate `R` in basis points:

```text
drip_total = floor(P * R / 10_000)
```

If the result is zero minor units, no allocation event is emitted.

### Dependency split

Dependency weights:

- positive integer basis points;
- sum exactly to 10,000;
- no duplicate Mission ref;
- bounded list length.

For each dependency:

```text
raw numerator = drip_total * weight_bps
floor amount  = raw numerator / 10_000
remainder     = raw numerator % 10_000
```

Any unallocated minor units are distributed by:

1. highest remainder first;
2. canonical dependency Mission ref as tie-breaker.

This guarantees:

```text
sum(dependency allocations) = drip_total
```

## No recursion

Only eligible primary human MCU grants create Infrastructure Drip allocations in WO-0017.

These do not trigger a drip:

- infrastructure allocation events;
- MCU adjustments;
- rule publication/activation;
- checkpoint creation;
- corrections.

General bounty rewards are added later in WO-0018.

## Version changes

The first bootstrap policy may activate after its publication has been externally checkpointed.

A replacement policy version requires:

- separate publication;
- public visibility before activation;
- a signed checkpoint covering the publication;
- at least 24 hours before production activation.

The activation clock/observation must come from trusted server-side state, not browser input.

Past grants/allocations never change when a later policy activates.

## Public verification

Infrastructure allocations must survive the same verification model as other economic events:

- append-only;
- command-idempotent;
- hash-linked;
- rule/version provenance;
- KMS-checkpointed;
- canonical export;
- offline verification.

A public/independent verifier must be able to prove:

- primary human amount;
- drip rate;
- dependency split;
- exact additional allocation;
- policy version;
- no deduction from the human grant.

## Cash rail

Dollar costs remain separate.

The intended hosted-network fee is cost-targeting:

```text
fee_rate =
  clamp(
    forecast_shared_cost + reserve_refill
    -------------------------------------
    trailing_hosted_network_commerce,
    min_rate,
    max_rate
  )
```

Current design envelope:

- illustrative minimum: 25 bps;
- hard maximum: 100 bps.

This is not implemented in WO-0017.

The future cash fee:

- lives on the money ledger;
- is transparent;
- is versioned;
- does not change MCU issuance;
- is not silently removed from an advertised MCU bounty;
- may fall as commerce grows faster than shared costs.

## Open-source exit

Running the open-source 99pct tree independently does not itself incur the hosted-network cash fee.

The hosted fee compensates hosted/shared services.

It is not a software-license toll.

The AGPL obligations remain separate from any hosted-service economics.
