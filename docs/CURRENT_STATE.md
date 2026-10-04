# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- Mission foundation Start + Discover accepted in WO-0007 and merged at `6872a8c`
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Live deployment baseline

Dedicated 99pct infrastructure:

- Firebase project: `pct-99`
- App Hosting backend: `pct99`
- region: `us-central1`
- generated URL: `https://pct99--pct-99.us-central1.hosted.app`
- automatic rollouts: off
- production Mission database: none

Accepted `main` `9d1cc6d` remains the live App Hosting release. WO-0007 product code is merged but deliberately not deployed because production Mission persistence is not provisioned yet.

The predecessor `missionism` Firebase backend remains independent and untouched.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not mix Mission product work into that PR and do not move apex/www traffic records until Firebase preparation is ready.

## Product state

The first real Mission slice now exists in source:

- verified public human session;
- Start a forming Mission;
- separate PostgreSQL Mission domain;
- append-only Mission description revisions;
- public Mission discovery;
- public Mission page;
- truthful empty states for Projects, contribution/MCUs, legal ownership, and governance.

It is not live yet because production persistence/auth runtime configuration has not been provisioned.

The target loop remains:

Mission → Project → Work → Join → Contribution → MCU history.

## Production persistence direction

ADR-014 selects a dedicated Cloud SQL for PostgreSQL 18 environment in the `pct-99` project, same region as App Hosting, using the Cloud SQL Node.js Connector, Secret Manager, fail-closed environment binding, least-privilege runtime credentials, backups/PITR, and deletion protection.

No paid Cloud SQL instance has been authorized or created yet.

Current published shared-core compute pricing for `db-f1-micro` in `us-central1` is approximately $0.0105/hour (~$7.67/month compute) plus storage/backups. Shared-core has no Cloud SQL SLA.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, unused Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only lint tooling and currently unpatched upstream.

The dependency-security CI policy remains required.

## Active engineering work

Execute `docs/work-orders/WO-0008-mission-production-readiness.md`.

WO-0008 makes Mission persistence/auth production-ready in code and CI, and inspects the exact GCP resource/cost plan. It must not create a recurring paid Cloud SQL resource without explicit product-owner approval.
