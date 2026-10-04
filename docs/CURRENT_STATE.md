# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Security + CI baseline accepted in WO-0004
- Dedicated 99pct App Hosting + PostgreSQL foundation accepted in WO-0005 through WO-0009
- Mission → Project → Work accepted through WO-0010
- Work interest accepted in WO-0011
- Mutual Work participation accepted in WO-0012 and merged at `fcde732`
- 99pct product-shell reset accepted in WO-0013 and merged at `deccfae`
- 99pct human-commerce network definition accepted in ADR-018 / ADR-019
- Application source license: `AGPL-3.0-only`

## Product identity

**99pct is the product/network/Mission. Missionism is the protocol underneath it.**

99pct is intended to become a shared human-commerce substrate with three modes:

- **Use** — people consume useful services;
- **Operate** — people deliver those services;
- **Build** — people build the infrastructure.

Utility Missions such as Rideshare 99, Stay 99, Music 99, and future local/service Missions sit on shared 99pct primitives rather than becoming unrelated products.

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live release:

- deployed application commit: `3197dbee18cc092b183b1852cfb551bf10cd7155`
- App Hosting build: `build-2026-10-04-015`
- automatic rollouts: off
- Mission health: ready
- Workspace health: intentionally unavailable

The live functional loop reaches:

`Mission → Project → Work → Interest → Invitation → Confirmation → Helping`

The production Mission database is migrated through `0005_work_participation.sql`.

## Economic-kernel priority

The next priority is **not** product-shell polish and not direct MCU/bounty UI.

Before 99pct can autonomously issue contribution credit or operate bounty rewards, it needs a small economic kernel that is designed to fail closed.

The kernel must make these facts true by construction:

- balances are derived, never authoritative mutable fields;
- economic history is append-only;
- corrections append compensating events;
- commands are idempotent;
- concurrent/retried execution cannot double-award;
- every outcome cites the exact immutable rule version that produced it;
- old rule versions remain reproducible;
- rule changes never rewrite prior history;
- economic automation is deterministic;
- AI may propose evidence/commands but cannot directly mint value;
- private identity does not enter public ledger exports;
- history can be exported and independently verified;
- tampering/reordering/deletion is detectable;
- ordinary application administrators have no “set MCU balance” or “mark bounty paid” capability.

“Unbreakable” is treated as a threat-model goal, not a literal claim. The kernel should resist bugs, retries, concurrency races, ordinary admin mistakes, silent row edits, stale workers, and post-hoc history rewriting. Compromise of every application/cloud/root credential simultaneously is outside that guarantee.

## Architecture direction

Economic state should be organized as:

```text
Command
  ↓ validate/auth/idempotency
Deterministic rule engine
  ↓
Append-only economic events
  ↓
Derived views / projections
  ├── MCU totals
  ├── bounty state
  └── audit/history

External effects
  ↓
idempotent outbox/connectors
  ├── money provider
  └── future legal/equity provider
```

No external network call belongs inside the transaction that decides an MCU outcome.

Money, MCUs, and legal ownership remain separate ledgers.

## Public shell

WO-0013 is complete and live.

The public application is now 99pct:

- homepage: **Build what should exist.**
- primary paths: **Use 99pct**, **Build 99pct**, **Start a Mission**
- `/use` truthfully states that no consumer Utility Mission is live yet
- `/work` exposes public open Work with aggregate interest/helping counts only
- `/missionism` keeps Missionism as the underlying protocol
- Mission / Project / Work / interest / participation behavior is unchanged
- no database migration or production-row mutation was part of the shell reset

Application rollback remains `build-2026-10-04-014`.

## Active engineering work

Execute `docs/work-orders/WO-0014-economic-kernel-foundation.md`.

WO-0014 builds the economic kernel in code + disposable PostgreSQL CI only.

It must not:

- change production schema;
- deploy economic behavior;
- issue production MCUs;
- publish production bounties;
- move money;
- issue legal ownership;
- change DNS/custom domains.

The first production integration comes only after the kernel survives adversarial review.
