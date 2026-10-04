# Next

Updated: 2026-10-04

## Active engineering

`WO-0013 — 99pct product-shell reset`

See `docs/work-orders/WO-0013-99pct-product-shell.md`.

The immediate goal is not another ledger feature. It is to make the product visibly match the network we are building.

### Three product modes

**Use 99pct**

A consumer layer where humans will eventually choose 99pct utilities for ordinary life: rides, stays, music, delivery, local services, and future Utility Missions.

No utility is live yet. The first shell must be truthful about that.

**Operate**

The domain-specific tools used by the humans actually delivering each utility: drivers, hosts, artists, couriers, and other operators.

Operator software will be introduced with the first real Utility Mission rather than as an empty generic dashboard.

**Build 99pct**

The infrastructure marketplace: Missions → Projects → Work → participation → Contribution → MCUs.

The current live product already reaches mutual Work participation.

### WO-0013 ships

- 99pct global branding;
- home organized around **Use / Build / Start**;
- public `/use` utility entry surface with an honest “none live yet” state;
- public `/work` Build marketplace using recorded Work;
- Missionism moved to `/missionism` as supporting protocol;
- primary product nav instead of protocol-heavy nav;
- existing Mission/Project/Work/help flows preserved;
- no database schema change.

## Step-by-step platform roadmap after WO-0013

1. **Contribution submission** — confirmed helpers record what they did.
2. **Contribution recognition** — a separate immutable review/recognition event.
3. **MCU ledger + Mission rules** — recognized Contribution can create append-only MCU grants under versioned rules.
4. **Bounty/reward Work** — Work may publish a transparent proposed reward only after the MCU/money distinction exists.
5. **Mission blueprints + dependency graph** — reusable open-source infrastructure can spawn/fork/localize Missions.
6. **Utility Mission foundation** — mark and discover customer-facing Utility Missions; define customer/operator/build interfaces.
7. **First utility vertical** — use one real vertical, likely Rideshare 99, to prove customer + operator + builder modes end to end.
8. **Local Mission instances** — reusable infrastructure can support local operating Missions without duplicating the whole platform.
9. **Money and legal ownership rails** — only after Contribution/MCU behavior is auditable and the actual legal/financial relationships are designed.

Do not attempt to build Rideshare, Stay, Music, payments, ownership, and a universal bounty engine simultaneously.

The platform should supply reusable primitives; each Utility Mission supplies its vertical-specific service logic.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked. The generated App Hosting URL remains the product host until the cutover is separately accepted.

Infrastructure hardening remains continuous, including removal/review of ADR-010 dependency exceptions before expiry.
