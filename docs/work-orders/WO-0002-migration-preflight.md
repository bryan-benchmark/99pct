# WO-0002 — Migration preflight

## Goal

Determine exactly what can be safely and usefully migrated from private `bryan-benchmark/missionism` into public `bryan-benchmark/99pct` without copying application code yet.

## Read

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- ADR-003, ADR-006, ADR-007 in `docs/DECISIONS.md`

## In scope

Inspect the private predecessor and produce a migration plan covering:

- application architecture worth preserving
- dependency/runtime versions
- environment-variable names only, never values
- secret/private-history exposure risk
- files/directories that must not be published
- Firebase deployment coupling
- PostgreSQL/workspace coupling
- feature-branch code worth migrating
- prototypes/obsolete code not worth migrating
- dependency/license concerns
- canonical/spec duplication that must be resolved
- exact sanitized migration method
- production rollback plan

Run secret-oriented and repository-history checks that are safe locally. Never paste discovered secret values into the PR or repo.

## Out of scope

- copying application code into 99pct
- publishing private Git history
- changing Firebase production
- changing databases
- product features
- selecting the final open-source license

## Acceptance

1. Produces a concrete migration inventory: keep, omit, reconsider.
2. Identifies secret/privacy risks without exposing secret values.
3. Identifies the exact source commit(s)/branch content proposed for the sanitized snapshot.
4. Identifies deployment/config files that need environment-specific handling.
5. Recommends a migration procedure that does not publish private history.
6. Defines rollback if the later baseline deployment fails.
7. No application code is added to 99pct.

## Verification

In the predecessor, run or report:

- current test command(s)
- lint
- typecheck
- build
- dependency/license inspection
- secret/history scan appropriate to the repository

If a check cannot be run, say why. Do not weaken tests.

## Durable output

Because this is a migration/security preflight, create:

`docs/implementation-reports/WO-0002-migration-preflight.md`

on the PR branch.

## Return

Open a PR from `wo/0002-migration-preflight` using the repository PR template. Do not migrate code and do not start the next work order.
