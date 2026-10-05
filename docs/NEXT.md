# Next

Updated: 2026-10-04

## Active engineering

`WO-0017 — Infrastructure Drip`

See:

`docs/work-orders/WO-0017-infrastructure-drip.md`

Goal: make shared 99pct infrastructure economically visible by construction **without reducing human grants and without turning MCUs into money or transferable tokens**.

### The invariant

For a recognition whose primary rule grants 100 MCUs:

```text
Contributor:               100 MCUs
Infrastructure allocation:   1 MCU   # at a 1% policy
```

The contributor still receives 100.

The Infrastructure Drip is additional issuance/accounting.

### Initial policy

Production canary target:

- starting MCU drip rate: **100 basis points = 1%**
- initial protocol maximum: **200 basis points = 2%**
- one initial dependency: **99pct Infrastructure Mission**
- dependency weight: 100%
- no recursive drip
- no retroactive drip on the existing WO-0016 grant

One percent is an initial rule version, not a permanent protocol constant.

Changing the configured rate/dependencies creates a new immutable policy version.

Changing the protocol maximum itself requires a future accepted protocol/code change.

### Mission-level allocation semantics

Do not create a fake human contributor for infrastructure.

Use a separate event such as:

`infrastructure_mcu_allocated`

It belongs to the **source Mission's** append-only stream and points to:

- the human grant that caused it;
- the active infrastructure-policy version;
- the dependency Mission receiving the allocation;
- the exact amount;
- a stable allocation key.

The event is not included in the human's MCU total.

There is no transfer/spend endpoint.

Humans maintaining the Infrastructure Mission continue to earn their own personal MCUs only through normal Contribution → recognition → grant.

### Two-rail rule

WO-0017 implements the MCU allocation rail.

It also freezes the future cash-rail contract:

- dollars pay dollar costs;
- target hosted fee may later be cost-targeting;
- illustrative operating range remains approximately 25–100 bps;
- hard cash maximum remains 100 bps unless a later accepted protocol decision changes it;
- self-hosted/open-source operation does not owe the hosted network fee.

WO-0017 moves **no money** and creates no cash ledger.

### After WO-0017

1. **WO-0018 — immutable bounty terms + autonomous MCU rewards**
   Bounties inherit the Infrastructure Drip automatically.

2. **WO-0019 — public checkpoint/transparency hardening**
   Public signed checkpoint publication, recovery exercises, and independent verifier packaging.

3. money bounty connector

4. rule-governance hardening

5. Mission blueprints / Utility Missions

## Completed

- WO-0013 — public 99pct shell
- WO-0014 — deterministic economic kernel
- WO-0015 — production economic shadow boundary
- WO-0016 — first real Contribution → MCU → signed checkpoint lifecycle

## Waiting externally

`WO-0006 — 99pct.com domain cutover` remains parked.
