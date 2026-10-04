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
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live release:

- deployed application commit: `efc6a26`
- App Hosting build: `build-2026-10-04-010`
- automatic rollouts: off
- `/api/health`: ready
- `/api/missions/health`: ready
- `/api/workspace/health`: unavailable by design

A verified human can:

- create an account;
- verify email;
- sign in;
- start a public forming Mission;
- discover Missions;
- read a Mission signed out.

Production contains one labeled alpha record: `WO-0009 test Mission`.

Its public page does not expose creator email and truthfully shows no Projects, contributions/MCUs, legal ownership, or governance yet.

## Production Mission persistence

Dedicated Cloud SQL:

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

Database:

- name: `missions`
- migration identity: separate
- runtime identity: `missions_runtime`
- runtime grants: least privilege
- environment binding: production / `pct-99` / `missions` / `pct-99:us-central1:pct99-missions-prod`

Secrets live in Secret Manager. App Hosting receives only the runtime DB password secret.

Current planning floor remains roughly $7.67/month compute + about $1.70/month SSD + backup/PITR storage, tax, and small egress. Shared-core has no Cloud SQL SLA.

## Firebase Auth

Email/Password is enabled.

The generated App Hosting host is authorized. `99pct.com` and `www.99pct.com` are also authorized for a later domain cutover, but this release does not depend on them.

No service-account JSON is used.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not move apex/www traffic records until Firebase preparation is ready.

## Product boundary

The live loop currently stops at:

Mission → **Projects + Work not yet implemented**

The broader target remains:

Mission → Project → Work → Join → Contribution → MCU history.

ADR-015 defines the next slice:

- Mission creator is the only writer until Join exists;
- Projects are bounded outcomes belonging to one Mission;
- Work is a public request for help under a Project;
- Work is not yet a job offer, contract, payment promise, MCU grant, or ownership grant;
- Project and Work descriptions use append-only revisions.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, unused Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only lint tooling and currently unpatched upstream.

The dependency-security CI policy remains required.

## Active engineering work

Execute `docs/work-orders/WO-0010-projects-and-work.md`.

WO-0010 may migrate the existing Mission production database and manually deploy the accepted slice after CI is green. It must not implement Join, contracts, payment, MCUs, equity, or custom-domain changes.
