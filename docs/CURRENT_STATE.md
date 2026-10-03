# Current State

Updated: 2026-10-03

## 99pct repository

- Public control plane: `bryan-benchmark/99pct`
- No application code yet
- No deployment yet
- No application CI yet
- `spec/canonical.json` matches the predecessor copy imported on 2026-10-03
- Accepted architecture: MCUs, legal equity, and money are separate ledgers
- Accepted migration direction: sanitized application snapshot into this repo after preflight; do not blindly publish the private predecessor's full history

## Private predecessor

Repository: `bryan-benchmark/missionism`

Production `main`:
- Next.js 16 / React 19 / Node 22
- Firebase App Hosting
- explanatory Missionism site and simulators
- tip inspected: `4747bf3`

Feature branch `feat/mission-workspace-v1`:
- 9 commits ahead of `main`
- Spark/Pilot/demo prototypes
- PostgreSQL Mission Workspace
- Firebase session auth
- append-only workspace history
- server-side membership checks
- local verification previously reported: 81 tests green, lint/typecheck/build green

These predecessor behaviors are candidates for reuse, not automatically the 99pct product model.

## Product not yet implemented here

Mission → Project → Work → Join → Contribution → MCU history.

Also not implemented: public contribution profiles, production MCU ledger, passkeys, progressive verification providers, legal equity settlement, payments, repurchase, financing, or secondary liquidity.

## Known risks

- The predecessor is private; migration must avoid leaking secrets, private history, internal artifacts, or inappropriate files.
- Older Missionism documents contain MCU wording that may conflict with ADR-001 (ADR-005).
- 99pct has no software license yet (ADR-007).
- The predecessor's feature branch includes prototypes and workspace code that may not all deserve migration.
- No production securities issuance or transfer exists today.

## Active next step

Execute `docs/work-orders/WO-0002-migration-preflight.md`.

No application code should be copied into this public repository until that work order is reviewed.
