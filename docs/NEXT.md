# Next

Updated: 2026-10-04

## Active engineering

`WO-0014 — Economic kernel foundation`

See `docs/work-orders/WO-0014-economic-kernel-foundation.md`.

Goal: build the smallest trustworthy core that future Contribution, MCU, bounty, money-connector, and ownership-connector features can depend on.

### Kernel laws

1. **Events are truth.**
   No mutable MCU balance or bounty-status row is authoritative.

2. **Commands are idempotent.**
   One logical command produces at most one economic result, even through retries/races.

3. **History is append-only.**
   Corrections are new events referencing prior events.

4. **Rules are immutable + versioned.**
   Every automated outcome names the exact rule/version used.

5. **Automation is deterministic.**
   Given the same prior events + command + rule, every correct implementation reaches the same economic result.

6. **AI cannot mint value.**
   Model output may become evidence/proposal input; deterministic policy decides economic events.

7. **No floating-point economics.**
   MCU arithmetic uses integer smallest units.

8. **No direct admin override.**
   There is no ordinary capability to set a balance, rewrite an event, or mark a reward paid.

9. **External side effects happen after commit.**
   Money/legal connectors are idempotent effects of recorded events, not part of the rule transaction.

10. **Independent verification is possible.**
    Exported history can be checked without trusting the running 99pct application.

### WO-0014 scope

Build and test, without production deployment:

- isolated economic schema/migrations;
- command receipt/idempotency model;
- append-only per-Mission event stream;
- deterministic sequence/hash chain;
- immutable/versioned rule registry + activation events;
- exact integer MCU unit type;
- pure command/rule engine boundary;
- derived MCU totals, never direct balance mutation;
- compensating adjustment model;
- reference bounty state machine in test/sandbox;
- exactly-once reward-key invariant;
- export format + offline verifier;
- tamper/deletion/reorder tests;
- concurrency/race tests;
- database role/trigger protections;
- documented threat model.

## Planned sequence after kernel acceptance

1. **WO-0015 — Contribution recognition + MCU issuance**
   Real Contribution submission/recognition uses the kernel; no bounties yet.

2. **WO-0016 — Bounty contracts + autonomous MCU rewards**
   Immutable bounty terms and completion conditions trigger exactly-once MCU rewards.

3. **WO-0017 — Transparency hardening**
   Signed/checkpointed ledger roots, public/verifiable exports, recovery/rebuild exercises.

4. **Money bounty connector**
   Cash rewards use external funded/escrow/payment infrastructure and idempotent provider events; no editable internal cash balance.

5. **Rule governance**
   Safe rule publication/activation, future approval thresholds, delays, freezes, and challenge/correction events.

6. Resume Mission blueprints / Utility Mission work on top of the economic kernel.

## Completed alongside the kernel priority

`WO-0013 — 99pct product-shell reset` is accepted and live as `build-2026-10-04-015`.

It does not change the active priority: WO-0014 remains the economic-kernel foundation.

## Waiting externally

`WO-0006 — 99pct.com domain cutover` remains parked.

One economic invariant at a time.
