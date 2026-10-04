# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- Mission foundation Start + Discover accepted in WO-0007 and merged at `6872a8c`
- Mission production-persistence readiness accepted in WO-0008 and merged at `754d785`
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

Accepted `main` `9d1cc6d` remains the live App Hosting release. Start + Discover Mission code is merged but deliberately not deployed because production Mission persistence/auth infrastructure is not provisioned yet.

The predecessor `missionism` Firebase backend remains independent and untouched.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not mix Mission product work into that PR and do not move apex/www traffic records until Firebase preparation is ready.

## Mission product source

The first real Mission slice is accepted in source:

- verified public human session;
- Start a forming Mission;
- PostgreSQL Mission domain;
- append-only Mission description revisions;
- public Mission discovery;
- public Mission page;
- explicit no-MCU/no-equity/no-governance empty states.

WO-0008 added and verified:

- Cloud SQL Node.js Connector production path;
- explicit fail-closed Mission environment binding;
- least-privilege Mission runtime grants;
- Mission migration/bind/smoke/restore tooling;
- `/api/missions/health`;
- separate PostgreSQL 18 Mission CI path;
- Secret Manager/App Hosting configuration template;
- read-only Firebase Auth inventory.

Both required CI jobs passed on run `37222492190`.

## Production resource state

No Cloud SQL instance, production Mission database, database secret, Firebase Auth provider change, App Hosting rollout, DNS change, or product deployment was created by WO-0008.

The proposed initial Cloud SQL resource is:

- project `pct-99`
- region `us-central1`
- instance `pct99-missions-prod`
- PostgreSQL 18 Enterprise
- zonal `db-f1-micro`
- 10 GiB SSD with auto-growth
- automated backups + PITR
- deletion protection
- public IP for Cloud SQL Connector with no authorized-network allowlist
- separate migration and runtime database users

Planning cost checked in WO-0008: about $7.67/month compute + about $1.70/month for 10 GiB SSD + backup/PITR storage, before tax/egress. Shared-core has no Cloud SQL SLA.

**Spend approval has not been granted. No recurring paid Mission database may be created yet.**

## Firebase Auth production gap

Read-only inventory found:

- no Firebase Web App in `pct-99`;
- Email/Password Auth is not enabled;
- authorized Auth domains are therefore not configured;
- Secret Manager has no Mission database secret.

WO-0009 includes these explicit activation steps only after Cloud SQL spend approval.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, unused Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only lint tooling and currently unpatched upstream.

The dependency-security CI policy remains required.

## Next release order — blocked

`docs/work-orders/WO-0009-provision-and-deploy-missions.md`

WO-0009 is queued but **must not execute resource creation or deployment until the product owner explicitly approves the recurring Cloud SQL spend**.
