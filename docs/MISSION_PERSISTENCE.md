# Mission production persistence

Status: production instance provisioned by WO-0009 after explicit spend approval on 2026-10-04. Operational evidence is in `docs/implementation-reports/WO-0009-provision-and-deploy-missions.md`.

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
| `projects` | SELECT, INSERT |
| `project_revisions` | SELECT, INSERT |
| `work_items` | SELECT, INSERT |
| `work_revisions` | SELECT, INSERT |

Projects and Work use this same dedicated Mission database and runtime role. The role still has no table-wide UPDATE, DELETE, TRUNCATE, REFERENCES, or TRIGGER, and it does not own the tables. Project and Work revision rows stay append-only.

No schema ownership, CREATE, DROP, mission update/delete, revision update/delete, or migration writes. The append-only revision triggers remain.

## Firebase human auth

WO-0009 found two existing web apps in `pct-99` and did not create another. Email/Password is enabled. The generated App Hosting host, `99pct.com`, and `www.99pct.com` are authorized domains. The public web API key is in `apphosting.yaml`. Server Firebase Admin uses App Hosting application default credentials. No service-account JSON key is committed.

Details and the domain list are in the WO-0009 implementation report.

## Eventual App Hosting config

`apphosting.missions.example.yaml` is not loaded by App Hosting. The release values live in `apphosting.yaml`, including the Secret Manager reference `mission-db-password`. Automatic rollouts stay off.

## Cloud SQL inventory

WO-0009 created the instance below. The planning price was rechecked on 2026-10-04 before creation and had not changed: `db-f1-micro` remains $0.0105 per hour, shared-core has no Cloud SQL SLA, and Google's us-central1 example with this machine and 10 GB storage and no backups remains $9.37 per month.

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

## Provisioned by WO-0009

Created after the 2026-10-04 spend approval:

1. Cloud SQL instance `pct99-missions-prod` with the settings above.
2. Database `missions`.
3. Migration user `missions_migrate` and runtime user `missions_runtime`.
4. Secret Manager secrets `mission-db-password`, `mission-db-migration-password`, and `mission-db-admin-password`.
5. IAM for `firebase-app-hosting-compute@pct-99.iam.gserviceaccount.com`: Cloud SQL Client, and Secret Accessor on `mission-db-password` only.

The live App Hosting configuration is `apphosting.yaml`. Automatic rollouts stay off.

WO-0010 adds Projects and Work in migration `0003_projects_work.sql` on this same database. It does not create another instance or change the machine size, region, backups, or deletion protection.
