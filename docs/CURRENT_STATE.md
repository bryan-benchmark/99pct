# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- Mission foundation Start + Discover accepted in WO-0007 and merged at `6872a8c`
- Mission production-persistence readiness accepted in WO-0008 and merged at `754d785`
- Start + Discover production release accepted in WO-0009 and merged at `4643b4f`
- Projects + needed Work accepted in WO-0010 and merged at `2756ebd`
- Work interest accepted in WO-0011 and merged at `2fbfb93`
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live release:

- deployed application commit: `1c3f4f4`
- App Hosting build: `build-2026-10-04-013`
- automatic rollouts: off
- `/api/health`: ready
- `/api/missions/health`: ready
- `/api/workspace/health`: unavailable by design

The live product loop is now:

Mission → Project → Work → expressed interest

Production contains labeled alpha records:

- `WO-0009 test Mission`
- `WO-0010 test Project`
- `WO-0010 test task`
- one labeled WO-0011 interest from a second verified human

A verified non-creator can say “I want to help” on an open Work item after explicitly consenting to share their verified email with the Mission creator.

Public pages expose only aggregate interest count. The interested human sees their own private state. The Mission creator privately sees interested email + note. Interest is immutable and does not create membership, assignment, contract, compensation, MCU, or ownership.

## Production Mission persistence

Dedicated Cloud SQL remains:

- project: `pct-99`
- region: `us-central1`
- instance: `pct99-missions-prod`
- PostgreSQL 18 Enterprise
- zonal `db-f1-micro`
- 10 GiB SSD with auto-growth
- automated backups enabled
- point-in-time recovery enabled
- deletion protection enabled
- public IP used through Cloud SQL Connector
- authorized networks empty

Database `missions` is migrated through:

- `0001_missions.sql`
- `0002_environment.sql`
- `0003_projects_work.sql`
- `0004_work_interests.sql`

Runtime role remains least privilege.

## Release compatibility rule

Mission health is forward-compatible with later additive migrations:

- every migration known to the running build must exist in order with the expected checksum;
- later migrations unknown to that build may exist;
- missing, reordered, or changed known migrations fail readiness;
- the migration runner itself remains strict.

While an older build is retained as a healthy rollback target, new production schema migrations must remain backward-compatible/additive with that retained build.

WO-0011 proved this in production: `0004` was applied while build-012 still served, and Mission health remained ready before build-013 rolled out.

## Firebase Auth

Email/Password is enabled.

The generated App Hosting host is authorized. `99pct.com` and `www.99pct.com` remain authorized for a future custom-domain cutover.

No service-account JSON is used.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not move apex/www traffic records until Firebase preparation is ready.

## Product boundary

The broader target remains:

Mission → Project → Work → Join → Contribution → MCU history.

ADR-017 defines the next slice as mutual Work participation:

1. Mission creator privately invites a human who already expressed interest.
2. That human separately confirms: **I’ll help on this Work.**
3. Only after both immutable records exist does the product say the human is **helping on this Work**.

This is a collaboration/participation record only. It is not Mission membership, employment, contractor status, a legal contract, compensation, an MCU grant, or ownership.

Multiple humans may eventually help the same Work item. Work remains open in this slice.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, unused Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only lint tooling and currently unpatched upstream.

The dependency-security CI policy remains required.

## Active engineering work

Execute `docs/work-orders/WO-0012-work-participation.md`.

WO-0012 may add an additive production migration and manually deploy after green CI. It must not create Mission membership, employment/contractor status, legal agreements, compensation, Contribution records, MCUs, equity, or custom-domain changes.
