# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Live deployment baseline

Dedicated 99pct infrastructure:

- Firebase project: `pct-99`
- App Hosting backend: `pct99`
- region: `us-central1`
- generated URL: `https://pct99--pct-99.us-central1.hosted.app`
- automatic rollouts: off
- workspace database: none

Accepted `main` `9d1cc6d` is live as `build-2026-10-04-006` on the generated URL. Public health is green. Workspace health remains intentionally unavailable.

The predecessor `missionism` Firebase backend remains independent and untouched.

## Domain cutover — waiting externally

WO-0006 / PR #11 is parked while DNS/Firebase preparation propagates.

- registrar: Namecheap
- authoritative DNS: Afternic
- Firebase custom-domain objects exist for apex and `www`
- ownership/certificate preparation is not complete
- apex/www traffic records must not move until preparation is ready

No active engineering work should be spent on WO-0006 while it waits. Resume that PR only when the Afternic preparation records are present and Firebase reports ownership/certificate readiness.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, installed only through the unused Firebase client Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only in the lint toolchain and currently unpatched upstream.

The dependency-security CI policy remains required.

## Product state

The target loop is:

Mission → Project → Work → Join → Contribution → MCU history.

The imported Spark flow is a useful interaction prototype but stores data in local files and explicitly is not a real Mission. The private Workspace `organization` object is also not the public Mission model.

ADR-013 establishes a new public Mission domain backed by PostgreSQL. Mission creation begins in `forming` state and creates no legal entity, MCU grant, contract, or legal ownership.

## Active engineering work

Execute `docs/work-orders/WO-0007-mission-foundation.md`.

WO-0007 builds and tests the first real Start / Discover Mission vertical slice in the repository. It does not provision a paid production database and does not promote the new product code to the live App Hosting backend.
