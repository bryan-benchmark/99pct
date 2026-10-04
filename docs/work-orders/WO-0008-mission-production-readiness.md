# WO-0008 — Mission production persistence readiness

## Goal

Make the accepted Start + Discover Mission slice production-ready **without creating or changing paid production infrastructure**.

By the end of this work order, the repository and CI must prove that:

- production Mission runtime can connect through the Cloud SQL Node.js Connector;
- Mission persistence is explicitly environment-bound and fail-closed;
- migration and runtime database privileges are separated;
- Mission migrations, smoke checks, backup/restore checks, and health checks are automated;
- Firebase human-auth runtime requirements are explicit;
- App Hosting/Secret Manager configuration is defined without committing secrets;
- the exact Cloud SQL resource/cost plan is recorded for product-owner approval.

Do not deploy the WO-0007 product code in this work order.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-010, ADR-011, ADR-013, ADR-014 in `docs/DECISIONS.md`
- current `apphosting.yaml`
- current Workspace environment/migration/runtime-role tooling for patterns only
- current official Firebase App Hosting Secret Manager configuration docs
- current official Cloud SQL PostgreSQL / Cloud Run / Node.js Connector docs

## Branch

`wo/0008-mission-production-readiness`

## Hard boundaries

Do not:

- create a Cloud SQL instance;
- create a paid managed database;
- create/delete production database users;
- attach a new recurring paid service;
- deploy or roll out WO-0007 code;
- change App Hosting traffic;
- change custom-domain/DNS state;
- modify WO-0006 / PR #11;
- enable Firestore;
- reuse Workspace `DATABASE_URL`;
- put a database password, service-account key, access token, or secret value in Git;
- weaken dependency-security policy;
- extend ADR-010 exception dates;
- add Projects/Work/Join/MCUs/equity.

If a pre-existing dedicated Mission database already exists, record it but do not mutate it without explicit authorization.

## 1. Production Mission connection contract

Keep local PGlite behavior for development/tests.

Add a production Mission runtime path that uses the official Cloud SQL Node.js Connector with `pg`.

Recommended runtime configuration names:

- `MISSION_RELEASE_TARGET` = `staging` or `production`
- `MISSION_DB_INSTANCE` = Cloud SQL instance connection name
- `MISSION_DB_NAME`
- `MISSION_DB_USER`
- `MISSION_DB_PASSWORD` = secret at runtime
- `FIREBASE_PROJECT_ID` or `GOOGLE_CLOUD_PROJECT`

Requirements:

- production runtime must never read Workspace `DATABASE_URL`;
- no raw public-IP allowlist connection path;
- connector connections are encrypted/authenticated by Google infrastructure;
- database password is still required for PostgreSQL database authentication in this initial design and must come from Secret Manager;
- pool size must be intentionally small for serverless use (for example 4–5 per serving instance);
- connector/pool cleanup must be supported for tests/operator scripts;
- a missing or malformed production config fails closed with a generic application error.

Use dependency injection or a small adapter so the production connector path can be tested without contacting Google Cloud.

Any new npm dependency must pass the repository audit policy.

## 2. Add Mission environment binding

Add a new checksum-tracked Mission migration; do not edit `0001_missions.sql` after acceptance.

Create a singleton environment-binding record sufficient to prove at runtime that the database was intentionally bound to this release environment.

At minimum store:

- release target;
- Firebase / Google Cloud project id;
- expected database name;
- Cloud SQL instance connection name;
- bound timestamp.

Add scripts/functions equivalent in intent to the useful Workspace binding pattern:

- bind a database explicitly;
- assert the binding at runtime;
- refuse a database bound to another target/project/name/instance;
- make repeated binding idempotent only when every binding value matches.

Production Mission runtime must check the binding before returning Mission data.

Do not expose the binding values in public API responses.

## 3. Least-privilege runtime role

Add a reviewed SQL grant script for the eventual Mission runtime user.

Current product behavior requires only:

### `human_accounts`
- SELECT
- INSERT
- UPDATE only as needed for verified-email refresh

### `missions`
- SELECT
- INSERT

### `mission_revisions`
- SELECT
- INSERT

Runtime must not receive:

- schema ownership;
- CREATE/DROP;
- UPDATE/DELETE on `missions`;
- UPDATE/DELETE on `mission_revisions`;
- migration-table mutation rights;
- superuser/database-owner privileges.

Keep the database trigger that rejects Mission revision update/delete.

Add a CI check that connects as the restricted role and proves:

- valid Mission creation succeeds;
- public list/get succeeds;
- forbidden revision update/delete fails;
- forbidden schema/migration mutation fails.

## 4. Operator tooling

Add explicit scripts for the Mission database. Names may follow this shape:

- `mission:migrate`
- `mission:bind-environment`
- `mission:grant-runtime` or documented SQL invocation
- `mission:check-runtime-role`
- `mission:pg-smoke`
- `mission:restore-check`

Migration/admin scripts may accept a separate operator connection URL or connector configuration, but that credential must never be the application runtime credential.

Migrations must remain explicit operator actions. Do not auto-run migrations inside request handling.

## 5. Mission database health

Add:

`GET /api/missions/health`

Contract:

- no authentication required;
- returns 200 only when the Mission database is reachable, migrations are current, and environment binding matches runtime config;
- otherwise returns 503;
- `Cache-Control: no-store`;
- minimal body only, such as `{"status":"ready"}` / `{"status":"unavailable"}`;
- no database name, instance id, credentials, project id, stack trace, or private data.

Keep `/api/health` as application-runtime health and `/api/workspace/health` as separate Workspace readiness.

Add focused tests for ready and unavailable states.

## 6. Complete Mission PostgreSQL CI

Extend the functional CI job so Mission database behavior is proved against real PostgreSQL 18 in addition to the PGlite unit/integration suite.

Use the existing disposable PostgreSQL service but a **separate database and role** from Workspace.

CI must:

1. create a disposable Mission database;
2. run Mission migrations;
3. bind it to a CI/staging Mission environment;
4. create/grant the restricted runtime role;
5. run Mission runtime-role checks;
6. run Mission PostgreSQL smoke;
7. verify append-only/restricted-write behavior;
8. take a logical backup;
9. restore into a second Mission database;
10. verify Mission/revision records and migration/environment state after restore.

Do not let Workspace and Mission schemas share a database merely for convenience.

Both functional and dependency-security jobs remain required.

## 7. Firebase human-auth production configuration contract

Inspect the actual Firebase project `pct-99` **read-only**.

Record whether these already exist:

- Firebase Web App suitable for 99pct;
- Email/Password authentication provider enabled;
- generated App Hosting domain authorized for Firebase Auth;
- `99pct.com` / `www.99pct.com` authorization state, if visible.

Do not enable/change them in this work order.

Define the exact runtime/build configuration required by the existing human auth code:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`;
- `NEXT_PUBLIC_FIREBASE_API_KEY`;
- server Firebase project identity through App Hosting / Google credentials.

The public Firebase API key is configuration, not a database secret. Do not put private service-account JSON in App Hosting when workload identity/default credentials are sufficient.

If code changes can safely consume App Hosting's automatically provided Firebase configuration instead of duplicating config, prefer the simpler supported path—but do not rewrite auth architecture just for elegance.

## 8. Secret Manager / App Hosting release template

Document the exact eventual App Hosting configuration but do not reference a nonexistent production secret in the live backend yet.

The deployment work order will need:

- non-secret Mission target/instance/database/user config;
- Secret Manager reference for `MISSION_DB_PASSWORD`;
- Firebase client config required by the browser;
- serving service account access to the password secret;
- serving service account `roles/cloudsql.client`.

Create a safe committed template/example or documentation if useful. Do not commit a secret value.

Automatic rollouts stay off.

## 9. Inspect the paid-resource plan

Read-only inspect project `pct-99` for existing Cloud SQL instances.

If no dedicated Mission instance exists, record the proposed initial resource:

- project: `pct-99`
- region: `us-central1`
- instance id: prefer `pct99-missions-prod`
- PostgreSQL: 18
- edition: Enterprise
- machine: `db-f1-micro` unless current platform constraints require another smallest supported tier
- availability: zonal / non-HA for early alpha
- storage: smallest reasonable SSD allocation supported by Cloud SQL
- storage auto-growth: enabled unless there is a documented reason not to
- automated backups: enabled
- point-in-time recovery: enabled
- deletion protection: enabled
- public IP may be enabled for Cloud SQL Connector use, but no broad authorized-network allowlist
- same-region placement with App Hosting

Record current published cost components from official pricing at execution time.

Current planning reference on 2026-10-04: shared-core `db-f1-micro` compute in `us-central1` is $0.0105/hour (~$7.67/month) before storage/backups. Re-check rather than trusting this note.

## 10. Paid-resource approval gate

This is mandatory.

If no already-authorized dedicated Mission instance exists, do **not** create it.

Finish repository work and open the PR with status:

`READY — BLOCKED ON EXPLICIT CLOUD SQL SPEND APPROVAL`

The PR must state:

- exact proposed instance configuration;
- expected recurring compute floor;
- storage/backup pricing caveat;
- whether any free credit applies if observable without exposing billing-private details;
- exact resources that will be created after approval.

Do not infer approval from:

- billing already being enabled;
- Firebase already being on Blaze;
- the existence of the App Hosting backend;
- a prior unrelated paid service.

Explicit product-owner approval is required.

## 11. Verification

Run:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

GitHub Actions must prove:

- existing Workspace PostgreSQL path remains green;
- new Mission PostgreSQL path is green through backup/restore;
- dependency-security job is green.

## 12. PR evidence

Use the PR as the implementation report.

Include:

- production Mission connection design;
- new migration/environment binding;
- runtime grant matrix;
- Mission PostgreSQL CI evidence;
- health endpoint contract;
- Firebase Auth read-only findings;
- App Hosting/Secret Manager eventual config;
- Cloud SQL read-only inventory;
- exact proposed paid resource and current cost estimate;
- explicit statement that no Cloud SQL instance, production DB, secret, auth-provider setting, rollout, DNS, or product deployment was created/changed.

## Acceptance

1. Cloud SQL Connector production path exists and is testable without cloud access.
2. Mission runtime cannot fall back to Workspace persistence.
3. Explicit Mission environment binding exists and is enforced.
4. Runtime database grants are least privilege and tested negatively.
5. Mission migration/bind/smoke/restore tooling exists.
6. `/api/missions/health` is minimal and fail-closed.
7. Real PostgreSQL 18 Mission CI passes independently of Workspace DB.
8. Firebase human-auth production requirements are accurately inventoried.
9. Secret Manager/App Hosting configuration is ready without committed secrets.
10. Exact paid Cloud SQL plan/cost is recorded.
11. No recurring paid database resource is created without explicit approval.
12. Full CI and dependency-security gates pass.
13. No deployment, DNS, MCU/equity, Projects/Work, or Workspace behavior change occurs.

## Return

Open the PR and stop.

If the paid resource is not already explicitly approved, mark the PR blocked on spend approval.

Do not provision Cloud SQL.
Do not deploy Start + Discover.
Do not resume WO-0006.
