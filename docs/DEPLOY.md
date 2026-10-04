# Deploy (Firebase App Hosting)

The repository is public. Application source is `AGPL-3.0-only`. `docs/` and `spec/` are not automatically covered; `LICENSE_SCOPE.md` is authoritative.

This page describes the public site. The customer workspace is not part of this rollout. Its database, identity, migration, backup, and recovery gates are in [WORKSPACE_OPERATIONS.md](WORKSPACE_OPERATIONS.md). Workspace routes fail closed without their server configuration. A successful public-site deploy or Next build is not a workspace release check.

## Current baseline

| Item | Value |
|------|--------|
| Firebase project | `pct-99` |
| App Hosting backend | `pct99` |
| Region | `us-central1` |
| Generated URL | `https://pct99--pct-99.us-central1.hosted.app` |
| Source repository | `bryan-benchmark/99pct` (link this repo; do not enable automatic rollouts) |
| Root directory | `/` |
| Config file | `apphosting.yaml` |
| Automatic rollouts | off |

`99pct.com` is not serving this backend yet. The domain is registered at Namecheap, but the authoritative DNS is Afternic (`ns1.afternic.com`, `ns2.afternic.com`). Do not edit Namecheap's Personal DNS Server screen, and do not transfer the registrar or the nameservers to make the site reachable. Web-routing changes belong in the Afternic zone, using only the records Firebase shows for backend `pct99`. The generated `hosted.app` URL stays the fallback until that cutover is connected.

The predecessor Firebase project and backend stay independent. Do not retarget them from this repository.

## Release model

Accepted releases are promoted manually by exact Git commit. Pushing a branch, including `main`, does not roll out a new version while automatic rollouts stay off.

Do not put secrets in Git. Runtime secrets belong in Secret Manager or another managed environment, referenced from App Hosting configuration when a later order authorizes them. This baseline has no workspace database secret.

`npm run build` is Next only, which is what App Hosting runs. Local gates before a rollout are `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit`. Both GitHub Actions jobs must be green before a rollout counts as release evidence.

## Manual promotion

From a checkout of the reviewed commit, with the Firebase CLI pointed at `pct-99`:

```bash
firebase apphosting:rollouts:create pct99 --git-commit <full-sha> --force --project pct-99
```

Use the commit SHA that was reviewed. Do not pass `--git-branch` for this baseline: a branch target is the automatic-rollout path.

Public smoke after a rollout:

- `/api/health` returns HTTP 200, `Cache-Control: no-store`, and `{"status":"ready","service":"99pct"}`.
- `/`, `/principles`, `/how-it-works`, and `/specification` return HTTP 200.
- The global footer contains `Source (AGPL-3.0)` linking to `https://github.com/bryan-benchmark/99pct`.

`/api/workspace/health` is a separate workspace readiness check. On this baseline it stays unavailable, because no workspace database is provisioned. Do not treat that 503 as a public-site failure, and do not point it at another project's database.

## Rollback

Roll back by restoring an earlier successful App Hosting rollout, or by creating a new manual rollout of the earlier reviewed commit:

```bash
firebase apphosting:rollouts:create pct99 --git-commit <earlier-sha> --force --project pct-99
```

Confirm `/` and `/api/health` on the generated URL after the restore. Roll forward the same way with the intended commit.

## One-time project notes

The dedicated project is `pct-99` (display name `99pct`). The backend `pct99` uses `apphosting.yaml`, root `/`, and the generated `hosted.app` domain only. Repository defaults in `.firebaserc` and `firebase.json` point at that project and backend.

Config in-repo: `apphosting.yaml`, `firebase.json`, `.firebaserc`.
