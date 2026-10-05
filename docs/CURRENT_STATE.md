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
- Economic kernel foundation accepted in WO-0014 and merged at `208f2be`
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

## Economic kernel — accepted in source

WO-0014 is accepted at `208f2be`.

The kernel now has:

- append-only per-Mission economic events;
- command idempotency;
- deterministic/versioned rules;
- bounded integer MCU units;
- stable exactly-once reward keys;
- compensating adjustments instead of balance edits;
- hash-linked history including timestamp provenance;
- command hashes including idempotency identity;
- exported rule rows bound to exact `rule_published` events;
- offline export verification;
- real concurrent PostgreSQL reward/idempotency tests;
- application / private-kernel-writer / verifier role separation;
- an intent mailbox that is not authoritative economic truth;
- AI proposal separation from economic commands.

No economic schema, route, worker, MCU, bounty, payment, or ownership behavior exists in production yet.

## Economic deployment principle

The first production economic deployment is **shadow infrastructure only**.

Before a real MCU can exist, 99pct must prove:

- the public application cannot impersonate recognition/governance process authority;
- separate submission capabilities exist for human, recognition, governance, and future bounty-recognition sources;
- the web application does not possess the private kernel-writer credential;
- a private worker can revalidate intents and append authoritative events;
- rejected/accepted intent processing is auditable and idempotent;
- production economic data can be exported, verified, backed up, and restored;
- future real-value history can be externally checkpointed/signed.

No real Contribution recognition, MCU issuance, bounty reward, money movement, or ownership event is allowed in WO-0015.

## Public shell

WO-0013 is complete and live.

The public application is 99pct:

- homepage: **Build what should exist.**
- primary paths: **Use 99pct**, **Build 99pct**, **Start a Mission**
- `/use` truthfully states that no consumer Utility Mission is live yet
- `/work` exposes public open Work with aggregate interest/helping counts only
- `/missionism` keeps Missionism as the underlying protocol

Application rollback remains `build-2026-10-04-014`.

## Active engineering work

Execute `docs/work-orders/WO-0015-economic-production-boundary.md`.

WO-0015 prepares and, after all gates, may provision the production economic **shadow** boundary using the existing approved Cloud SQL instance without enabling user-facing economic mutation.

It must mint zero production MCUs and publish zero production bounties.

The first real-value work order comes only after WO-0015 is accepted.
