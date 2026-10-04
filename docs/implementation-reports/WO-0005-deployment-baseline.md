# WO-0005 — Deployment baseline

Date: 2026-10-04

## Dedicated infrastructure

| Item | Value |
|------|--------|
| Firebase project | `pct-99` (display name `99pct`, project number `494723962533`) |
| Billing | Already enabled on the existing account. No new billing account was attached. |
| App Hosting backend | `pct99` |
| Region | `us-central1` |
| Generated URL | `https://pct99--pct-99.us-central1.hosted.app` |
| Source repository | `bryan-benchmark/99pct` |
| Repository link | `projects/pct-99/locations/us-central1/connections/apphosting-github-conn-pct99/gitRepositoryLinks/bryan-benchmark-99pct` |
| Root directory | `/` |
| Config | `apphosting.yaml` |
| Custom domain | none. The only domain is the generated `hosted.app` domain. |

`.firebaserc` defaults to `pct-99`. `firebase.json` names backend `pct99` only.

## Predecessor left untouched

Read before this work and again after the rollouts:

- project `missionism`
- backend `missionism` in `us-east4`
- URI `missionism--missionism.us-east4.hosted.app`
- codebase link `bryan-benchmark-missionism`
- `updateTime` remained `2026-09-26T15:47:08.907741Z`

No predecessor domain, DNS record, or database was changed. `99pct.com` was not attached. No workspace database was provisioned.

## Automatic rollouts

Off. After every rollout in this order, backend traffic had no `rolloutPolicy`. Each release is a 100% split to one explicit build. Branch pushes do not promote a release.

## Rollouts

| Rollout | Build | Commit | State | Role |
|---------|-------|--------|-------|------|
| `build-2026-10-04-001` | `build-2026-10-04-001` | `8f90c8271dd1e1708c1857fd6baf56d8be267758` | `SUCCEEDED` | First baseline rollout |
| `build-2026-10-04-002` | `build-2026-10-04-002` | `64f68b9e00638e015785ec35c09a8ff9f75164c8` | `SUCCEEDED` | Second rollout, documentation only |
| `build-2026-10-04-003` | `build-2026-10-04-001` (retained) | `8f90c8271dd1e1708c1857fd6baf56d8be267758` | `SUCCEEDED` | Restore to the first retained build |
| `build-2026-10-04-004` | `build-2026-10-04-004` | `8f90c8271dd1e1708c1857fd6baf56d8be267758` | `SUCCEEDED` | Later manual rollout of the same earlier commit |

Both builds `001` and `002` stayed `READY`. The restore did not rebuild `001`.

GitHub Actions:

- `37214941854` on `8f90c8271dd1e1708c1857fd6baf56d8be267758`: `dependency-security` and `functional` passed.
- `37215468795` on `64f68b9e00638e015785ec35c09a8ff9f75164c8`: both jobs passed.

## Source link and public health

Against `https://pct99--pct-99.us-central1.hosted.app` after the first rollout:

| Check | Result |
|-------|--------|
| `/` | 200, footer contains `Source (AGPL-3.0)` linking to `https://github.com/bryan-benchmark/99pct` |
| `/principles` | 200 |
| `/how-it-works` | 200 |
| `/specification` | 200 |
| `/api/health` | 200, `Cache-Control: no-store`, `{"status":"ready","service":"99pct"}` |
| `/api/workspace/health` | 503, `Cache-Control: no-store`, `{"status":"unavailable"}` |

The workspace check did not report ready. The App Hosting build log mentions `missionism` only as the existing npm package name `missionism-com`. The only ERROR request log in that smoke window is the expected 503 for `/api/workspace/health`.

After traffic returned to retained build `001`, `/` and `/api/health` were checked again: both 200, health body unchanged, and the footer source link still present.

## Rollback

A direct traffic update that set `updateMask=current` completed without moving the live split.

A new rollout, `build-2026-10-04-003`, pointed at retained build `build-2026-10-04-001`. It stayed `PROGRESSING` for about two minutes, then reached `SUCCEEDED`. Traffic was then 100% on that original build, with no `rolloutPolicy`. `/` and `/api/health` returned 200 during that window. This was not an instant switch.

While `003` still showed `PROGRESSING`, a separate manual rollout of the same earlier commit was also started. That became `build-2026-10-04-004`. It later reached `SUCCEEDED` and took 100% traffic. It is another rollout of `8f90c8271dd1e1708c1857fd6baf56d8be267758`, not a different application revision. Automatic rollouts stayed off.

## Roll forward

This commit is the roll-forward target. Its GitHub Actions run must be green before it is promoted. The rollout identifier for this commit is recorded in the pull request after that promotion. The post-promotion smoke checks are `/` and `/api/health`.

## Local verification

On Node 22, before the first rollout: `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed. The audit policy reported high=9, moderate=0, critical=0. The two existing exceptions still expire 2026-11-03.

## Remaining before `99pct.com`

Custom-domain cutover, DNS, and any workspace production database remain later work orders. Automatic rollouts stay off.
