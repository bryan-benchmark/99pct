# Decisions

Accepted records are binding. Proposed records are not implemented until accepted.

## ADR-001 — MCUs are contribution units, not bearer securities

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

MCUs represent recognized contribution. They are not assumed to be transferable legal securities. Legal shares or other instruments are a separate ledger, created only when a Mission's legal process issues them.

Implication: SEC-007 and SEC-008 apply.

## ADR-002 — Three ledgers; 99pct is not the ownership authority

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Contribution/MCUs, legal equity, and money are separate ledgers. 99pct may orchestrate them but is not the sole authority for legal ownership or money.

## ADR-003 — Preserve the predecessor stack during foundation work

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Do not rewrite the existing Next.js, Firebase, Firebase Auth, and PostgreSQL architecture merely to begin 99pct.

## ADR-004 — This repository is the control plane

Status: Accepted  
Date: 2026-10-03

`bryan-benchmark/99pct` is the shared source of truth for product, architecture, work orders, review state, and canonical short claims. Chat transcripts are not project memory.

## ADR-005 — Reconcile older MCU wording with ADR-001

Status: Proposed  
Date: 2026-10-03

Older Missionism material sometimes describes an MCU as both a contribution credit and an ownership claim. A later documentation order should reconcile that wording without changing the append-only contribution model or creating a global MCU market.

## ADR-006 — 99pct becomes the application repository after sanitized migration

Status: Accepted  
Date: 2026-10-03

`bryan-benchmark/missionism` is a private predecessor. Do not publish or merge its full Git history into this public repository without a dedicated secret/privacy/history audit.

First perform migration preflight. Then import a sanitized current application snapshot, preserving useful architecture without blindly publishing private history. Keep the existing stack unless a later accepted ADR changes it.

After migration, new 99pct product development occurs here. The Missionism repository becomes predecessor/archive rather than a second active product source.

## ADR-007 — Open-source licensing

Status: Proposed  
Date: 2026-10-03

A public GitHub repository is not itself an open-source license. Choose licenses before application code is published here.

Current candidate: AGPL-3.0 for the hosted application so modified network forks remain open. Protocol/document licensing may be separate.

Mission governance requirements such as funding or ownership rules must not be assumed to be enforceable merely through the software license.

## ADR-008 — Pull requests are the default implementation report

Status: Accepted  
Date: 2026-10-03

Each Cursor work order uses one `wo/<number>-<short-name>` branch and one PR. The standardized PR body records acceptance criteria, tests, migrations, invariant impact, deviations, and risks.

Standalone files in `docs/implementation-reports/` are reserved for migrations, security audits, releases, or work orders that explicitly require them.

Reason: avoid duplicating the same implementation narrative in chat, a report file, and a PR.

## ADR-009 — Minimal-context agent protocol

Status: Accepted  
Date: 2026-10-03

Agents read `AGENTS.md`, `CURRENT_STATE.md`, and the assigned work order by default. The work order explicitly names any additional architecture/security/product context required.

Reason: canonical docs remain durable without paying the token cost of loading all of them on every implementation turn.
