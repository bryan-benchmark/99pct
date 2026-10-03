# Current State

Updated: 2026-10-03

## 99pct repository

- Public control plane: `bryan-benchmark/99pct`
- No application code yet
- No deployment yet
- No application CI yet
- `spec/canonical.json` remains the canonical short-claim source
- Accepted architecture: MCUs, legal equity, and money are separate ledgers
- WO-0002 migration preflight accepted and merged at `3171e6f`

## Migration findings

The private predecessor can be migrated only as a sanitized tracked snapshot, not by publishing its Git history or copying a developer working directory.

Proposed source tree: `321d4b6` on `feat/mission-workspace-v1`.

Before any public application snapshot is accepted:

- resolve ADR-007 licensing;
- use a clean tracked archive;
- preserve 99pct control-plane paths;
- run a standard credential/secret scanner;
- run a privacy/publication scan for personal compensation/employment/legal material and other private artifacts;
- run verify, lint, typecheck, and build;
- do not retarget Firebase, move the domain, or touch a shared database in the import.

The detailed preflight is `docs/implementation-reports/WO-0002-migration-preflight.md`.

## Private predecessor

`bryan-benchmark/missionism` remains the live/private predecessor.

- production `main` tip inspected: `4747bf3`
- feature branch is 9 commits ahead
- Next.js 16 / React 19 / Node 22
- Firebase App Hosting/Auth
- PostgreSQL Mission Workspace
- append-only workspace history and server-side authorization
- preflight verification: 81 tests passed; lint, typecheck, build exit 0

These are migration candidates, not automatically the 99pct product model.

## Product not yet implemented here

Mission → Project → Work → Join → Contribution → MCU history.

Also not implemented: public contribution profiles, production MCU ledger, passkeys, progressive verification providers, legal equity settlement, payments, repurchase, financing, or secondary liquidity.

## Active blocker

ADR-007: choose the open-source license before application code is published into this public repository.
