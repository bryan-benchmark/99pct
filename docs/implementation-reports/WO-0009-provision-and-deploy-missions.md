# WO-0009 — Provision and deploy Start + Discover

Date: 2026-10-04

## Spend approval

The product owner approved the recurring Cloud SQL spend on 2026-10-04 after the cost was restated: about $7.67/month compute, about $1.70/month for 10 GiB SSD, plus backup/PITR storage, tax, and small egress. The approval message was “yeah thats fine.”

Published pricing was rechecked the same day before any instance was created. `db-f1-micro` in the shared-core table is still $0.0105 per hour. Shared-core machines are still outside the Cloud SQL SLA. Google’s us-central1 example for this machine, 10 GB storage, and no backups is still $9.37 per month. That floor had not changed, so creation proceeded on the approved target.

## Cloud SQL

| Item | Value |
|------|--------|
| Project | `pct-99` |
| Region / zone | `us-central1` / `us-central1-a` |
| Instance | `pct99-missions-prod` |
| Connection name | `pct-99:us-central1:pct99-missions-prod` |
| Database version | PostgreSQL 18 |
| Edition | Enterprise |
| Tier | zonal `db-f1-micro` |
| Disk | 10 GiB SSD, storage auto-increase on |
| Public IP | enabled for the Cloud SQL connector |
| Authorized networks | empty |
| State | `RUNNABLE` |

No private IP is configured. The public address is omitted from this report.

Recurring estimate remains about $7.67/month compute plus about $1.70/month for 10 GiB SSD, plus backup and PITR storage, tax, and any small egress. Shared-core has no Cloud SQL SLA.

## Database identities

| Identity | Use |
|----------|-----|
| `postgres` | Cloud SQL built-in admin. Password stored as `mission-db-admin-password`. Not used by App Hosting or migrations. |
| `missions_migrate` | Operator migrations, binding, and grants. Password stored as `mission-db-migration-password`. Not referenced by `apphosting.yaml`. |
| `missions_runtime` | Application runtime. Password stored as `mission-db-password`. Created with `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, and `NOINHERIT`. |

Database name: `missions`.

`npm run mission:migrate` and `npm run mission:bind-environment` ran as `missions_migrate`. The binding is `production`, project `pct-99`, database `missions`, instance `pct-99:us-central1:pct99-missions-prod`.

`scripts/mission-runtime-grants.sql` was applied to `missions_runtime`. `npm run mission:check-runtime-role` passed. `npm run mission:prod-check` proved a rolled-back write and a rejected revision update, then confirmed `missions` and `human_accounts` were still empty.

## Backup and recovery

Verified on the new instance:

- automated backups enabled, 7 retained, start time 08:00 UTC
- the first automated backup completed successfully (`1791140688662`)
- point-in-time recovery enabled, transaction log retention 7 days
- deletion protection enabled

Application rollback restores an earlier App Hosting rollout and does not delete the database. Database recovery uses Cloud SQL backups or point-in-time recovery. Migrations are not reversed after product writes. Locate backups with `gcloud sql backups list --instance=pct99-missions-prod --project=pct-99`.

## Firebase Auth

No new web app was created. Project `pct-99` already had two web apps, `pct99` and `pct-99`, sharing one public web API key. The release uses the existing `pct99` app `1:494723962533:web:b2e1a503d77d4c3a8cdf4c`.

Email/Password sign-in is enabled and a password is required. No other identity provider was enabled. No service-account JSON was created or committed.

Authorized domains:

- `localhost`
- `pct-99.firebaseapp.com`
- `pct-99.web.app`
- `pct99--pct-99.us-central1.hosted.app`
- `99pct.com`
- `www.99pct.com`

The release depends only on the generated App Hosting host. `99pct.com` and `www.99pct.com` are authorized so later domain cutover does not require another Auth change. DNS and the custom-domain attachment were not changed.

## IAM

Serving service account `firebase-app-hosting-compute@pct-99.iam.gserviceaccount.com`:

- `roles/cloudsql.client` on project `pct-99`
- `roles/secretmanager.secretAccessor` on secret `mission-db-password` only

`mission-db-migration-password` and `mission-db-admin-password` have no bindings. App Hosting does not receive them.

## App Hosting configuration

`apphosting.yaml` now carries the production Mission target, instance, database, runtime user, Secret Manager password reference, and public Firebase project/API key. Automatic rollouts were still off after these resource changes. Resource limits are unchanged: minimum 0, maximum 10, concurrency 80, 1 CPU, 512 MiB.

## Rollout

Pending promotion of the green commit. This section is updated after the manual rollout.

## Boundaries

No custom-domain or DNS change. WO-0006 / PR #11 was not modified. The predecessor `missionism` backend was not modified. Workspace was not pointed at the Mission database. Firestore was not enabled. No Projects, Work, Join, MCU, or equity behavior was added.
