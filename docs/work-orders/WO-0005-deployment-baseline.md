# WO-0005 — 99pct deployment baseline

## Goal

Prove that the accepted 99pct repository can be deployed safely on **99pct-owned infrastructure isolated from the predecessor**, before any custom-domain cutover or product work begins.

The successful outcome is a reachable Firebase App Hosting generated URL serving the current explanatory application, with:

- a visible AGPL source-code link;
- a simple public application health endpoint;
- commit-specific rollout evidence;
- rollback evidence/procedure;
- no reuse or modification of the predecessor Missionism backend;
- no shared workspace database;
- no `99pct.com` DNS/domain change.

This is a deployment-baseline work order, not the public launch.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- ADR-007, ADR-010, ADR-011 in `docs/DECISIONS.md`
- `docs/SECURITY_INVARIANTS.md`
- `docs/DEPLOY.md`
- `docs/WORKSPACE_OPERATIONS.md`
- `apphosting.yaml`
- `apphosting.staging.yaml`
- `.firebaserc`
- `firebase.json`
- `src/components/SiteFooter.tsx`
- current Firebase App Hosting documentation if CLI syntax or behavior differs from repository notes

## Branch

`wo/0005-deployment-baseline`

## Hard boundaries

Do not:

- modify or retarget the predecessor Firebase project/backend;
- attach `99pct.com` or any custom domain;
- change DNS;
- connect to any existing/shared production PostgreSQL database;
- create a workspace production database;
- enable automatic App Hosting rollouts;
- turn a workspace failure into a fake success;
- add product features or change Missionism/99pct product semantics;
- weaken WO-0004 security/CI gates;
- extend the two dependency exceptions beyond their existing 2026-11-03 review date.

A generated Firebase App Hosting `hosted.app` URL is the only network target authorized in this order.

## 1. Establish a separate Firebase project/backend

First inspect the authenticated Firebase/Google Cloud account and existing projects.

If a Firebase project clearly dedicated to 99pct already exists and is not the predecessor project, record and reuse it.

Otherwise create a new Firebase project dedicated to 99pct:

- display name: `99pct`;
- use a valid globally unique project ID that begins with a letter; prefer a `pct99-` prefix;
- do not rename or repurpose the existing Missionism project.

App Hosting requires billing-capable project setup. Do **not** silently attach a new paid billing account or accept a new paid plan on the user's behalf.

If backend creation is blocked only because a human must explicitly enable/attach billing, stop the cloud-resource portion, record the exact blocker and exact one-time human action required, and still complete the safe repository changes below. Do not fall back to the predecessor project.

Create one App Hosting backend dedicated to this baseline.

Requirements:

- source repository: `bryan-benchmark/99pct`;
- live/source branch may be `main`, but **automatic rollouts must be disabled**;
- root directory: repository root;
- no custom domain;
- no workspace database secret;
- no predecessor Firebase project IDs or backend IDs;
- use the normal `apphosting.yaml` public-site configuration, not the workspace `apphosting.staging.yaml` database configuration.

Record the actual Firebase project ID, backend ID, region, generated URL, and automatic-rollout state in the durable report.

## 2. Remove predecessor deployment coupling from repository defaults

After the dedicated 99pct project/backend exists, update repository deployment metadata so a normal maintainer does not accidentally target Missionism.

Update as appropriate:

- `.firebaserc`
- `firebase.json`
- `docs/DEPLOY.md`

The committed defaults must point only at the new 99pct Firebase project/backend.

Do not add secrets.

If the cloud-resource portion is blocked by required human billing action, do **not** guess identifiers. Instead:

- rewrite `docs/DEPLOY.md` so the intended separate-infrastructure procedure is correct;
- leave machine-target config unchanged until the real project/backend exists;
- clearly mark the PR as blocked rather than pretending acceptance.

## 3. Add the AGPL source path before any network rollout

The public interface must expose a clear source link from the global footer before the first App Hosting rollout.

Add a visible footer link:

`Source (AGPL-3.0)`

Target:

`https://github.com/bryan-benchmark/99pct`

Requirements:

- ordinary anchor/link visible on every normal page through the global footer;
- do not put the full AGPL license text in the footer;
- do not imply `docs/` or `spec/` are AGPL-covered;
- keep `LICENSE_SCOPE.md` authoritative for scope.

Add a focused automated check that would fail if the public source link disappears or points somewhere else.

## 4. Add a public application health endpoint

Add:

`GET /api/health`

It should:

- require no authentication;
- require no database;
- require no Firebase Auth;
- return HTTP 200 when the Next application runtime is serving;
- return a minimal JSON body such as `{"status":"ready","service":"99pct"}`;
- use `Cache-Control: no-store`;
- expose no secrets, environment values, infrastructure IDs, user data, or internal stack traces.

This endpoint is distinct from `/api/workspace/health`.

The existing workspace health endpoint may continue returning 503 on this baseline because no workspace database/environment is being provisioned.

Add a focused test for the public health response contract.

## 5. Verify repository gates before rollout

Before creating a network rollout, run locally:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

All must pass.

The PR's GitHub Actions functional and dependency-security jobs must also be green before the rollout is considered valid evidence.

## 6. Manually roll out a specific commit

Do not rely on automatic deployment from branch pushes.

Use Firebase App Hosting's manual rollout mechanism and target a specific reviewed commit from this work-order branch.

Record:

- deployed Git commit SHA;
- rollout/build identifier;
- rollout status;
- generated App Hosting URL.

Do not attach `99pct.com`.

If Firebase offers to enable automatic rollouts during setup, leave them disabled after setup and prove the final state in the report.

## 7. Network smoke tests

Against the generated App Hosting URL, verify at minimum:

### Public application

- `/` → 200
- `/principles` → 200
- `/how-it-works` → 200
- `/specification` → 200
- `/api/health` → 200 with the expected minimal JSON
- homepage/footer HTML contains the visible GitHub source link

### Fail-closed workspace

- `/api/workspace/health` must **not** claim ready without an intentionally provisioned workspace database;
- expected baseline result is 503/unavailable;
- no request may connect to the predecessor/shared workspace database.

Inspect App Hosting/Cloud Run logs for the smoke period and record whether any unexpected application errors occurred.

Do not record secret values or user-identifying logs.

## 8. Prove rollback control

App Hosting supports commit-specific rollouts and restoration of prior successful rollouts.

For this baseline, produce concrete rollback evidence.

Preferred proof:

1. create a successful baseline rollout;
2. create a second successful manual rollout from another commit in this WO branch that contains the same required source/health protections;
3. use App Hosting rollback/restore to return to the first successful rollout;
4. verify `/` and `/api/health`;
5. roll forward again to the intended final WO-0005 commit and re-run the two smoke checks.

Do not manufacture a product change just to make the two builds visibly different. A documentation-only second commit is acceptable if App Hosting builds it as a distinct rollout.

If App Hosting cannot provide two retained successful builds in this setup, document the exact platform limitation and prove the documented manual "roll out earlier commit" path instead. Do not claim an instant rollback was executed if it was not.

## 9. Rewrite deployment documentation

Replace predecessor-era assumptions in `docs/DEPLOY.md`.

It must describe the current 99pct release model:

- repository is public;
- 99pct uses its own Firebase project/backend;
- automatic rollouts are off during the baseline/cutover phase;
- accepted releases are manually promoted by exact commit;
- generated App Hosting URL is used before custom-domain cutover;
- secrets belong in managed environment/Secret Manager, not Git;
- `/api/health` is the public runtime smoke endpoint;
- `/api/workspace/health` is a separate workspace readiness check;
- rollback is performed through App Hosting rollout history / earlier commit;
- public network versions expose the AGPL source link;
- `99pct.com` cutover is a later work order.

Do not preserve instructions that tell a maintainer to connect `bryan-benchmark/missionism` as the source repository.

## 10. Durable report

Create:

`docs/implementation-reports/WO-0005-deployment-baseline.md`

Include:

- dedicated Firebase project ID and backend ID;
- generated App Hosting URL;
- proof predecessor project/backend was not modified;
- automatic-rollout state;
- deployed commit SHA(s);
- rollout/build IDs;
- source-link evidence;
- public health evidence;
- public-route smoke results;
- workspace fail-closed result;
- rollback evidence;
- local verification results;
- GitHub Actions run ID/results;
- remaining blockers before `99pct.com` cutover.

Do not include:

- secret values;
- service-account JSON;
- database connection strings;
- private logs;
- access tokens.

## Acceptance

1. 99pct has a dedicated Firebase project/backend separate from the predecessor.
2. Repository deployment defaults no longer target the predecessor.
3. Automatic App Hosting rollouts are disabled.
4. No custom domain or DNS was changed.
5. No shared/production workspace database was provisioned or touched.
6. A global visible `Source (AGPL-3.0)` link points to the public 99pct repository and has a regression check.
7. `GET /api/health` returns the minimal 200/no-store application-health contract and has a focused test.
8. Local functional/security gates pass.
9. Both GitHub Actions jobs pass.
10. A specific commit is successfully served from the generated App Hosting URL.
11. Required public routes pass network smoke tests.
12. Workspace readiness remains fail-closed without a workspace environment.
13. Rollback/restore control is concretely proven or an exact platform limitation is documented without false claims.
14. `docs/DEPLOY.md` describes the new 99pct release model accurately.
15. Durable deployment report contains evidence without secrets.

## If blocked by authentication or billing

Do not improvise around account controls.

Finish safe repository-only changes, document the exact blocker, and open the PR as **BLOCKED** rather than claiming acceptance.

The reviewer will decide the next human action.

## Return

Open the PR and stop.

Do not attach `99pct.com`.
Do not change DNS.
Do not deploy workspace production.
Do not start the next work order.
