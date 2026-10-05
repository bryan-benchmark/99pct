# Next

Updated: 2026-10-04

## Active engineering

`WO-0015 — Economic production boundary / shadow ledger`

See `docs/work-orders/WO-0015-economic-production-boundary.md`.

Goal: move the accepted kernel from disposable CI into a real production-grade boundary **without creating economic value**.

### What this order proves

- economic data lives in a separate database boundary from Mission product data;
- the application-facing credential cannot append economic truth;
- capability-specific submitters cannot impersonate each other;
- recognition/rule authority comes from the trusted submission channel, not a browser-supplied actor string;
- the private kernel writer is isolated from App Hosting;
- intent processing is idempotent and auditable;
- backups / restore / export / verifier work on the production economic database;
- checkpoint-signing format and verifier are ready before first real MCU.

### No-value rule

WO-0015 must leave production with:

- zero real MCU grants;
- zero production bounty rewards;
- zero money movement;
- zero legal-ownership events;
- no public endpoint that can mint value.

## Planned sequence after WO-0015

1. **WO-0016 — Contribution submission + recognition + first MCU issuance**
   A confirmed helper submits Contribution; a separate recognition authority records recognition; the kernel deterministically creates the first real MCU grant.

2. **WO-0017 — Bounty terms + autonomous MCU rewards**
   Work can publish immutable MCU bounty terms. Recognized completion triggers exactly-once reward through the kernel.

3. **WO-0018 — Transparency/checkpoint hardening**
   Public signed checkpoints, recovery/rebuild drills, independent verifier packaging, and transparency publication.

4. **Money bounty connector**
   Cash rewards use external funded/escrow/payment infrastructure and idempotent provider events; 99pct does not maintain an editable custodial cash balance.

5. **Rule governance**
   Multi-party publication/activation, delays, freezes, challenges, and compensating corrections.

6. Mission blueprints / Utility Missions build on the same kernel.

## KMS / checkpoint gate

Before the first production MCU is considered durable economic history, use a non-exportable signing/checkpoint authority such as Cloud KMS and publish verifiable checkpoint material outside the mutable event database.

WO-0015 should implement and test the signing/checkpoint interface and exact deployment plan.

**Do not create a new paid KMS key/resource unless product-owner approval is explicitly recorded.**

If approval is absent, WO-0015 may finish with checkpoint infrastructure code/config ready and WO-0016 remains blocked on that approval.

## Completed

- WO-0013 product shell is live as `build-2026-10-04-015`.
- WO-0014 economic kernel is accepted at `208f2be`.

## Waiting externally

`WO-0006 — 99pct.com domain cutover` remains parked.

One economic invariant at a time.
