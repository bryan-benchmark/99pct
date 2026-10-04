# WO-0009 — Provision and deploy Start + Discover

## Status gate

**DO NOT EXECUTE THIS WORK ORDER UNTIL EXPLICIT CLOUD SQL SPEND APPROVAL IS RECORDED BY THE PRODUCT OWNER.**

Billing being enabled, Blaze being active, or WO-0008 being accepted is not approval.

If approval has not been explicitly given, stop immediately with:

`BLOCKED — EXPLICIT CLOUD SQL SPEND APPROVAL REQUIRED`

Do not create resources "just to get ready."

## Goal

After explicit spend approval, create the smallest safe production persistence/auth environment for the already-accepted Start + Discover Mission slice and make that slice live on the generated App Hosting domain.

Successful outcome:

- dedicated Cloud SQL PostgreSQL 18 instance exists in `pct-99`;
- backups/PITR/deletion protection are enabled;
- separate migration and runtime DB credentials exist;
- Mission schema is migrated and explicitly environment-bound;
- runtime role is least privilege;
- Firebase Web App + Email/Password Auth are configured for 99pct;
- App Hosting reads runtime DB password from Secret Manager;
- serving service account has only needed Cloud SQL/secret permissions;
- exact reviewed commit is manually promoted with automatic rollouts still off;
- live human sign-up, email verification, sign-in, Mission creation, discovery, public read, Mission health, and workspace fail-closed behavior are verified;
- no custom-domain cutover is required.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/MISSION_PERSISTENCE.md`
- `docs/DEPLOY.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-010, ADR-011, ADR-013, ADR-014 in `docs/DECISIONS.md`
- `apphosting.missions.example.yaml`
- current official Cloud SQL PostgreSQL / Node Connector docs
- current Firebase Auth and App Hosting config docs

## Branch

`wo/0009-provision-and-deploy-missions`

## Hard boundaries

Do not:

- execute without explicit spend approval;
- create HA/multi-region resources;
- use a larger DB tier than approved;
- enable automatic App Hosting rollouts;
- attach or change `99pct.com`;
- change DNS;
- modify WO-0006 / PR #11;
- touch the predecessor `missionism` backend;
- connect Workspace to the Mission database;
- grant the runtime DB user schema ownership/superuser privileges;
- commit DB passwords, service-account JSON, API tokens, or secret payloads;
- enable Firestore;
- add Projects/Work/Join/MCUs/equity;
- alter accepted Mission migration history;
- weaken dependency-security policy or extend ADR-010 exceptions.

## 1. Reconfirm approval and current plan

Before any resource creation, record in the PR/report:

- the exact product-owner approval message/date;
- the proposed recurring resource;
- current estimated monthly floor;
- any material pricing/config change since WO-0008.

If the smallest supported configuration or price materially changed, stop and obtain renewed approval before creating anything.

Approved planning target unless renewed approval says otherwise:

- project: `pct-99`
- region: `us-central1`
- instance: `pct99-missions-prod`
- PostgreSQL 18
- Enterprise edition
- zonal
- `db-f1-micro`
- 10 GiB SSD
- storage auto-increase on
- automated backups on
- PITR on
- deletion protection on
- public IP available to the Cloud SQL Connector
- authorized networks empty

## 2. Create Cloud SQL safely

Enable only APIs required for this release.

Create the approved instance.

Verify after creation:

- exact project/region/version/tier;
- zonal/non-HA;
- storage size/type and auto-growth;
- automated backups enabled;
- PITR enabled;
- deletion protection enabled;
- no broad authorized network;
- instance state healthy/runnable.

Do not publish private IP/password material in the PR.

## 3. Create database and split credentials

Create database:

`missions`

Create two distinct login identities:

### Migration/operator identity

Used only for explicit migration/binding/grant/operator tasks.

It may have the privileges needed to own/manage the Mission schema but must not be used by App Hosting runtime.

### Runtime identity

`missions_runtime`

It receives only the grants in `scripts/mission-runtime-grants.sql`.

Generate strong random passwords. Do not choose human-memorable passwords.

Store secrets in Secret Manager.

Recommended secrets:

- `mission-db-password` — runtime password, consumed by App Hosting
- `mission-db-migration-password` — operator password, not exposed to the serving application

If a different exact secret naming is required by platform constraints, document it.

Do not commit either value or echo it into durable logs.

## 4. Migrate, bind, and grant

Using the migration/operator identity:

1. run `npm run mission:migrate`;
2. bind the database with:
   - target `production`
   - project `pct-99`
   - database `missions`
   - instance `pct-99:us-central1:pct99-missions-prod`;
3. apply `scripts/mission-runtime-grants.sql` to `missions_runtime`;
4. run the restricted-role checker against the runtime identity;
5. run a production-safe smoke that proves schema/binding/grants without leaving fake public Missions behind.

Do not run the CI-only smoke if it intentionally writes test records that will persist publicly. If needed, add a production-safe transaction/rollback smoke or operator check.

Verify the database remains empty of fake public Missions before live release.

## 5. Verify backup/recovery posture

Before product writes go live:

- verify automated backup schedule enabled;
- verify PITR enabled and retention/window;
- verify deletion protection enabled;
- record the recovery procedure at a high level;
- record how to locate the latest backup/PITR state.

Do not intentionally destroy production data to prove recovery.

The logical backup/restore CI evidence from WO-0008 remains part of readiness; production requires platform backup/PITR configuration evidence.

## 6. Configure Firebase human auth

In project `pct-99`:

1. create one Firebase Web App for the 99pct web client if none exists;
2. obtain its public web config/API key;
3. enable Email/Password sign-in;
4. authorize the generated App Hosting hostname:
   `pct99--pct-99.us-central1.hosted.app`;
5. if Firebase safely allows `99pct.com` and `www.99pct.com` to be authorized before DNS cutover, they may be added, but the release must not depend on them;
6. do not enable unrelated identity providers.

Do not create or download service-account JSON.

Server-side Firebase Admin must use App Hosting/Google application default credentials.

## 7. IAM and Secret Manager

Serving service account:

`firebase-app-hosting-compute@pct-99.iam.gserviceaccount.com`

Grant only what is required:

- `roles/cloudsql.client` for Cloud SQL connectivity;
- Secret Manager accessor **on the runtime DB password secret only**.

Do not grant Secret Manager project-wide access if secret-level IAM is available.

Do not grant migration-secret access to the serving service account.

Document exact IAM bindings created.

## 8. Update real App Hosting configuration

Promote the accepted template into the real `apphosting.yaml`.

Required runtime/build config:

- `MISSION_RELEASE_TARGET=production`
- `MISSION_DB_INSTANCE=pct-99:us-central1:pct99-missions-prod`
- `MISSION_DB_NAME=missions`
- `MISSION_DB_USER=missions_runtime`
- `MISSION_DB_PASSWORD` from Secret Manager
- `FIREBASE_PROJECT_ID=pct-99`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=pct-99`
- real public Firebase Web App API key/config required by the existing client

Keep:

- automatic rollouts off;
- current resource limits unless evidence requires change;
- no Workspace DB configuration;
- no secret literal in Git.

Remove or update the example/template only if doing so reduces ambiguity; do not create two conflicting release sources of truth.

## 9. Full repository verification before rollout

On the final branch head:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

Both required GitHub Actions jobs must pass.

Do not deploy a red commit.

## 10. Manually promote an exact commit

Automatic rollouts remain off.

Manually roll out the exact green WO-0009 branch commit to backend `pct99`.

Record:

- commit SHA;
- rollout/build id;
- status;
- generated URL;
- automatic rollout state.

Do not attach or cut over the custom domain.

## 11. Live smoke — read-only first

Before creating an account:

- `/` → 200
- `/api/health` → ready
- `/missions` → 200
- `/api/missions/health` → 200 `{"status":"ready"}`
- `/api/workspace/health` remains unavailable unless separately configured
- source link remains present
- App Hosting logs show no unexpected DB/config errors

If Mission health is not ready, stop and roll back the App Hosting release before attempting writes.

## 12. Live end-to-end human/Mission test

Use a designated test account controlled by the product owner or a clearly disposable project test address.

Prove the actual user journey:

1. open `/missions/new` signed out → sign-in flow;
2. create account;
3. receive and complete Firebase email verification;
4. sign in;
5. create one clearly labeled test forming Mission;
6. land on its public Mission page;
7. Mission appears in `/missions`;
8. public page contains no creator email;
9. empty states still say no contributions/MCUs/legal ownership/governance;
10. sign out;
11. Mission remains publicly readable signed out.

Use a harmless test Mission name that is obviously test data.

After evidence is captured, remove test data only through an explicit operator cleanup if one exists and if doing so does not violate append-only product-history promises. For this initial alpha, it is acceptable to retain one clearly labeled test Mission rather than invent destructive product APIs.

Do not manually edit/delete append-only revision history from the production database merely to make the demo look clean.

## 13. Security/operational checks after write

Verify:

- runtime role still passes least-privilege checker;
- migration identity is not used by App Hosting;
- runtime secret is readable by serving service account;
- migration secret is not;
- environment binding still matches;
- backups/PITR/deletion protection remain enabled;
- no Workspace database variables were introduced;
- no Firestore import/use was introduced;
- no unexpected moderate-or-higher dependency advisory was added.

## 14. Rollback plan

Application rollback:

- retain prior successful App Hosting build;
- if product/auth/DB behavior fails materially, restore prior build through App Hosting rollout history;
- generated App Hosting URL remains the validation target.

Database rollback:

- application rollback does **not** delete the database or data;
- do not automatically reverse migrations after writes;
- use backups/PITR only for genuine data-recovery incidents;
- environment binding and append-only history remain intact.

If the new app is rolled back, Mission production infrastructure may remain provisioned but unused until corrected. Record continuing cost.

## 15. Durable report

Create:

`docs/implementation-reports/WO-0009-provision-and-deploy-missions.md`

Include:

- explicit spend approval reference;
- created Cloud SQL configuration;
- current recurring cost estimate;
- DB/database-user/secret names without values;
- backup/PITR/deletion-protection evidence;
- Firebase Web App + Auth provider state;
- authorized domains;
- IAM bindings;
- deployed commit/build;
- CI run;
- Mission health;
- live human/Mission journey evidence;
- source/privacy/empty-state checks;
- rollback evidence/procedure;
- confirmation custom-domain/DNS state stayed untouched;
- confirmation predecessor/Workspace remained separate;
- remaining blockers before Projects + Work.

Never include passwords, secret values, verification links/tokens, session cookies, private email contents, or service-account credentials.

## Acceptance

1. Explicit spend approval is recorded before resource creation.
2. Approved Cloud SQL instance exists with the approved small configuration.
3. Backups, PITR, deletion protection, and storage auto-growth are enabled.
4. Migration and runtime DB identities are separate.
5. Runtime grants are least privilege and re-verified.
6. Mission environment binding matches the production instance.
7. Runtime password is in Secret Manager and absent from Git.
8. Serving service account has only required Cloud SQL/secret access.
9. Firebase Web App exists; Email/Password is enabled; generated host is authorized.
10. Both GitHub Actions jobs pass on the deployed commit.
11. Exact commit is manually deployed with automatic rollouts off.
12. `/api/missions/health` is ready on the live generated host.
13. Live verified-human Start → Discover → Read flow succeeds.
14. Creator email/private auth data is not exposed publicly.
15. No MCU/equity/governance claims are fabricated.
16. No custom-domain/DNS, predecessor, Workspace DB, or Firestore change occurs.
17. Durable report contains operational evidence without secrets.

## Return

Open/update the PR with all evidence and stop.

Do not start Projects + Work.
Do not resume WO-0006.
