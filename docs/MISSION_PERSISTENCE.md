# Mission production persistence

Status: ready in the repository, blocked on explicit Cloud SQL spend approval.

No Cloud SQL instance, database user, secret, Auth provider change, or App Hosting rollout was created by this preparation.

## Connection

Production runtime uses `@google-cloud/cloud-sql-connector` with `pg`. The connector opens an encrypted connection for instance `MISSION_DB_INSTANCE` with password authentication. The application does not configure a public-IP allowlist or read Workspace `DATABASE_URL`.

Runtime configuration:

- `MISSION_RELEASE_TARGET` = `staging` or `production`
- `MISSION_DB_INSTANCE` = Cloud SQL connection name
- `MISSION_DB_NAME`
- `MISSION_DB_USER`
- `MISSION_DB_PASSWORD` from Secret Manager
- `FIREBASE_PROJECT_ID` or `GOOGLE_CLOUD_PROJECT`

The pool maximum is 5. A missing or malformed value fails closed with `Mission database is not configured.` Migrations are operator commands (`npm run mission:migrate`) and are not run during a request.

Local development and unit tests keep PGlite.

## Environment binding

Migration `0002_environment.sql` adds one `mission_environment` row: release target, Firebase project id, database name, Cloud SQL connection name, and bound timestamp. `npm run mission:bind-environment` is idempotent only when every value matches. Runtime and `GET /api/missions/health` refuse a different binding. The health body is only `{"status":"ready"}` or `{"status":"unavailable"}`.

## Runtime grants

`scripts/mission-runtime-grants.sql` grants the runtime role:

| Table | Runtime |
| --- | --- |
| `human_accounts` | SELECT, INSERT, UPDATE of `verified_email` only |
| `missions` | SELECT, INSERT |
| `mission_revisions` | SELECT, INSERT |
| `mission_schema_migrations` | SELECT |
| `mission_environment` | SELECT |

No schema ownership, CREATE, DROP, mission update/delete, revision update/delete, or migration writes. The append-only revision triggers remain.

## Firebase human auth, read on 2026-10-04

Project `pct-99` is active. Inventory was read-only:

- Firebase web apps: none
- Identity Platform config: `CONFIGURATION_NOT_FOUND`, so Email/Password is not enabled and authorized domains are not published
- generated App Hosting host `pct99--pct-99.us-central1.hosted.app` is therefore not an authorized Auth domain yet
- `99pct.com` and `www.99pct.com` authorization is not visible because Auth is not configured
- serving service account: `firebase-app-hosting-compute@pct-99.iam.gserviceaccount.com`
- automatic rollout policy: off
- Secret Manager: no secrets

The existing human sign-in code needs `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_API_KEY` in the browser build, and server project identity through App Hosting application default credentials. Do not add a service-account JSON key. Those public values stay unset until a web app exists. Auth settings were not changed.

## Eventual App Hosting config

`apphosting.missions.example.yaml` is not loaded by App Hosting. After approval, the release work creates the secret `mission-db-password`, grants the serving service account `roles/secretmanager.secretAccessor` on that secret and `roles/cloudsql.client`, then copies the example env into `apphosting.yaml`. The live file does not reference the secret yet.

## Cloud SQL inventory and proposed spend

Cloud SQL Admin API has not been used on `pct-99` and is disabled. No instance was listed, and none was created.

Proposed resource, not created:

- project `pct-99`
- region `us-central1`
- instance id `pct99-missions-prod`
- PostgreSQL 18, Enterprise edition, zonal `db-f1-micro` (shared core, 0.6 GiB RAM)
- 10 GiB SSD, storage auto-increase on
- automated backups and point-in-time recovery on
- deletion protection on
- public IP on for the connector, authorized networks empty
- database `missions`
- runtime user `missions_runtime` and a separate migration user

Published Google Cloud pricing checked 2026-10-04 for Iowa (`us-central1`):

- `db-f1-micro` compute is $0.0105 per hour, about $7.67 for a 730-hour month
- shared-core machines are not covered by the Cloud SQL SLA
- SSD capacity in that region group is $0.000232877 per GiB-hour, about $0.17 per GiB-month; 10 GiB is about $1.70 per month
- backup storage is $0.000109589 per used GiB-hour, about $0.08 per GiB-month, and grows with retained backups and PITR
- Google's own test-instance example with this machine, 10 GB storage, and no backups is $9.37 per month before tax and network egress

No free-credit balance was visible from the project billing description. Billing already being enabled is not approval to create this instance.

## After approval

Create only:

1. Cloud SQL instance `pct99-missions-prod` with the settings above.
2. Database `missions`.
3. Migration and runtime database users.
4. Secret Manager secret `mission-db-password`.
5. IAM for the serving service account: Cloud SQL Client, and Secret Accessor on that secret.
6. Firebase web app, Email/Password provider, and authorized domains, in a later auth/release step rather than as a hidden side effect of the database.

Do not deploy Start + Discover until that binding is in place.
