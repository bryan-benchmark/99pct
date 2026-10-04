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
- `roles/secretmanager.secretAccessor` on secret `mission-db-password`
- `roles/secretmanager.viewer` on that same secret, added by App Hosting's grant-access command

The App Hosting service agent `service-494723962533@gcp-sa-firebaseapphosting.iam.gserviceaccount.com` has `roles/secretmanager.secretVersionManager` on `mission-db-password` only, which is what the rollout needs to pin the secret version. These are secret-level bindings, not project-wide Secret Manager access.

`mission-db-migration-password` and `mission-db-admin-password` have no bindings. App Hosting does not receive them.

## App Hosting configuration

`apphosting.yaml` now carries the production Mission target, instance, database, runtime user, Secret Manager password reference, and public Firebase project/API key. Automatic rollouts were still off after these resource changes. Resource limits are unchanged: minimum 0, maximum 10, concurrency 80, 1 CPU, 512 MiB.

## Rollout

Automatic rollouts stayed off. The first rollout of `8ccfcb1` failed before traffic moved because App Hosting could not read `mission-db-password`. `firebase apphosting:secrets:grantaccess` added secret-level access for the App Hosting service agent. The retry succeeded.

Live release:

| Item | Value |
|------|--------|
| Commit | `efc6a26` |
| Build | `build-2026-10-04-010` |
| State | ready |
| URL | `https://pct99--pct-99.us-central1.hosted.app` |
| Automatic rollouts | off |

`build-2026-10-04-007` failed during the secret-access attempt and did not replace the previous release. `build-2026-10-04-008` served `8ccfcb1`. `build-2026-10-04-009` served the sign-in origin fix. `build-2026-10-04-010` is the current release.

App Hosting presents the public `hosted.app` origin to the browser and the internal Cloud Run host to the application. Human sign-in and Mission creation now accept the public App Hosting origin, `99pct.com`, and `www.99pct.com`, and still reject any other origin. Workspace routes keep the stricter same-host check.

## Live checks

On `https://pct99--pct-99.us-central1.hosted.app` after `build-2026-10-04-010`:

- `/` returned 200 and the footer still links `Source (AGPL-3.0)` to `https://github.com/bryan-benchmark/99pct`
- `/api/health` returned 200 `{"status":"ready","service":"99pct"}` with `Cache-Control: no-store`
- `/missions` returned 200
- `/api/missions/health` returned 200 `{"status":"ready"}` with `Cache-Control: no-store`
- `/api/workspace/health` stayed 503 `{"status":"unavailable"}`
- `/principles`, `/how-it-works`, and `/specification` returned 200

A disposable test account created an account, received the Firebase verification email, verified the address, signed in, and started one forming Mission named `WO-0009 test Mission`. The public page and the public list show that Mission, the four empty-state lines, and no creator email. Signing out left the Mission publicly readable. The production database contains that one Mission.

The first verification email's action link omitted the public web API key, and the Firebase action page rejected it. Adding the already-public web API key verified the address. A later verification email included the key.

CI for the deployed commit passed both required jobs on run `37228668951`. Earlier commits on this branch passed `37227155168` and `37228027073`.

After the write, the runtime role check passed again, the environment binding still matches production, and backups, point-in-time recovery, and deletion protection were still enabled.

## Rollback

Application rollback is a manual rollout of the previous successful build, `build-2026-10-04-006`, commit `9d1cc6d`. That does not delete the database or the test Mission. Database recovery uses the automated backup or point-in-time recovery and is reserved for a real data incident.

## Boundaries

No custom-domain or DNS change. WO-0006 / PR #11 was not modified. The predecessor `missionism` backend was not modified. Workspace was not pointed at the Mission database. Firestore was not enabled. No Projects, Work, Join, MCU, or equity behavior was added.
