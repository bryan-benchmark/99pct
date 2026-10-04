# WO-0005 — Deployment baseline

Date: 2026-10-04

Status: first manual rollout succeeded. Rollback evidence is recorded after the second rollout of this documentation commit.

## Dedicated infrastructure

| Item | Value |
|------|--------|
| Firebase project | `pct-99` (display name `99pct`, project number `494723962533`) |
| Billing | Already enabled on the existing account. No new billing account was attached. |
| App Hosting backend | `pct99` |
| Region | `us-central1` |
| Generated URL | `https://pct99--pct-99.us-central1.hosted.app` |
| Source repository | `bryan-benchmark/99pct` |
| Root directory | `/` |
| Config | `apphosting.yaml` |
| Custom domain | none |

Repository defaults in `.firebaserc` and `firebase.json` point only at `pct-99` / `pct99`.

## Predecessor left untouched

The predecessor backend was read before and after this work:

- project `missionism`
- backend `missionism` in `us-east4`
- URI `missionism--missionism.us-east4.hosted.app`
- codebase link `bryan-benchmark-missionism`
- `updateTime` remained `2026-09-26T15:47:08.907741Z`

No predecessor domain, DNS record, or database was changed. `99pct.com` was not attached.

## Automatic rollouts

Off. Backend traffic has no `rolloutPolicy`. The live split is 100% of one explicit build. Branch pushes do not promote a release.

## First rollout

| Item | Value |
|------|--------|
| Git commit | `8f90c8271dd1e1708c1857fd6baf56d8be267758` |
| Rollout | `build-2026-10-04-001` |
| Build | `projects/pct-99/locations/us-central1/backends/pct99/builds/build-2026-10-04-001` |
| Build state | `READY` |
| Rollout state | `SUCCEEDED` |
| Source commit on the build | `8f90c8271dd1e1708c1857fd6baf56d8be267758` |
| GitHub Actions run | `37214941854` |

Both jobs on that run passed: `dependency-security` and `functional`.

## Source link and public health

On `https://pct99--pct-99.us-central1.hosted.app` after the first rollout:

| Check | Result |
|-------|--------|
| `/` | 200, footer contains `Source (AGPL-3.0)` linking to `https://github.com/bryan-benchmark/99pct` |
| `/principles` | 200 |
| `/how-it-works` | 200 |
| `/specification` | 200 |
| `/api/health` | 200, `Cache-Control: no-store`, `{"status":"ready","service":"99pct"}` |
| `/api/workspace/health` | 503, `Cache-Control: no-store`, `{"status":"unavailable"}` |

The workspace check did not report ready. No workspace database was provisioned. The App Hosting build log mentions `missionism` only as the existing npm package name `missionism-com`. The only ERROR request log in the smoke window is that expected 503.

## Local verification

On Node 22, before the first rollout: `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed. The audit policy reported high=9, moderate=0, critical=0. The two existing exceptions still expire 2026-11-03.

## Rollback

Not yet executed at the time of this commit. This documentation commit is the second rollout target. After its Actions run is green, the procedure is: roll out this commit, restore traffic to `build-2026-10-04-001`, recheck `/` and `/api/health`, then roll forward to the final commit.

## Remaining before `99pct.com`

Custom-domain cutover, DNS, and any workspace production database remain later work orders. Automatic rollouts stay off.
