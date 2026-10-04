# WO-0013 — 99pct product shell

## Result

The generated host is now the 99pct product. A visitor can Use 99pct, Build 99pct, or Start a Mission without first learning Missionism. Missionism remains the protocol underneath, at `/missionism`. No consumer utility is presented as live.

- Pull request: https://github.com/bryan-benchmark/99pct/pull/25
- Deployed commit: `3197dbee18cc092b183b1852cfb551bf10cd7155`
- Build: `build-2026-10-04-015`, state `READY`
- Rollout: `build-2026-10-04-015`, state `SUCCEEDED`
- URL: `https://pct99--pct-99.us-central1.hosted.app`
- Automatic rollouts: off (`rolloutPolicy` null)
- Application rollback: `build-2026-10-04-014` of `28e2ff2c3277140a3562bf6bebb1e7a3ebdd776b`

## Product identity

Before this order, the public shell still presented Missionism as the product: the Missionism wordmark, default title, favicon, and a homepage built around the locked Missionism definition.

After this order:

- The global mark is the typographic **99%**, with accessible name `99pct home`.
- Default title is `99pct`. Page titles use `%s · 99pct`.
- The description is: “Open-source infrastructure for people to start Missions, find Work, and build what should exist together.”
- The Missionism icon, wordmark, and favicon are gone. No custom favicon replaced them.
- Primary navigation is Use, Build, Missions, Start, and Missionism.
- The footer is “99pct · For the 99%, by the 99%.” with Missionism, Principles, Specification, Open Questions, and Source (AGPL-3.0). Predecessor demos are not in the nav or footer, and their routes were not deleted.

## Homepage

`/` no longer uses the Missionism H1, wordmark, or canonical protocol status as its frame.

- Eyebrow: FOR THE 99%, BY THE 99%
- H1: Build what should exist.
- Primary actions: Use 99pct (`/use`), Build 99pct (`/work`), Start a Mission (`/missions/new`). Explore Missions remains a secondary path to `/missions`.
- Modes: Use, Operate, and Build, with the statement that no consumer Utility Mission is live yet.
- Live now lists the existing primitives: start a Mission, create Projects, post needed Work, express interest, and mutually confirm helping.
- Being built next lists Contribution, recognition, MCUs, and legal ownership as future work. The page does not say those rails are live, and it shows no balances, percentages, users, revenue, MCU totals, or ownership numbers.
- Powered by Missionism links to `/missionism`.
- Source (AGPL-3.0) stays visible and points at `https://github.com/bryan-benchmark/99pct`.

## Use, Find Work, and Missionism

`/use` is titled Use 99pct. Rideshare 99, Stay 99, and Music 99 are labeled future examples and are not links. The page states that no 99pct utilities are live yet, and that future customer services can use different interfaces on the same substrate. It does not show ratings, inventory, prices, or transaction counts.

`/work` is public and signed-out. It lists open Work newest first, at most 100 items, with Mission, Project, title, Task or Role, description, done-when, created date, and aggregate interest and helping counts. The query selects only those public fields. It does not return emails, notes, Firebase uids, interest ids, invitation ids, or confirmation ids. The page says open Work is a request for help, not a paid job, contract, MCU grant, or ownership grant. If the Mission database is not configured, the page says Work is not available in this environment yet.

`/missionism` renders the locked short definition verbatim, then: “99pct uses Missionism as its organizational protocol. 99pct is the product; Missionism is the system underneath it.” It links Principles, How It Works, Why Now, Specification, Open Questions, and Changes. Those protocol pages keep Missionism language. `spec/canonical.json` was not rewritten.

## Existing Mission flow

Mission creation, Projects, Work, interest, invitation, and confirmation were not changed. The Missions list copy now says starting a Mission does not create a company, a fundraiser, ownership, or a legal entity.

There is no database migration, grant change, Auth change, DNS change, or production-row mutation. `0001` through `0005` are unchanged. Contribution, MCU calculation, bounties, payments, and legal ownership were not implemented.

## CI

GitHub Actions run `37242863625` passed both jobs on `3197dbee18cc092b183b1852cfb551bf10cd7155`:

- functional
- dependency-security

Local `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed before the pull request. Lint still reports the pre-existing unused `getPublicProject` warning. Audit policy remained `high=9 moderate=0 critical=0`.

## Production

Before rollout, `build-2026-10-04-014` was the serving revision. `GET /api/missions/health` returned 200 `{"status":"ready"}`. `GET /api/health` returned 200 ready. `GET /api/workspace/health` returned 503 unavailable. The commit diff contains no schema, migration, or grant files.

The exact green commit was then rolled out to backend `pct99` in project `pct-99`. Cloud Run’s latest ready revision is `pct99-build-2026-10-04-015`. Automatic rollouts stayed off. No custom-domain cutover. The predecessor backend was not touched.

## Live smoke

On `https://pct99--pct-99.us-central1.hosted.app`:

| Route | Result |
|---|---|
| `/` | 200. Title `99pct`. H1 “Build what should exist.” No `<h1>Missionism</h1>`. |
| `/use` | 200. “No 99pct utilities are live yet.” Future examples are text, not marketplaces. |
| `/missions` | 200. Existing forming Mission is listed. |
| `/work` | 200. The existing WO-0010 test task is listed with Mission and Project context, `1 person interested`, and `1 person helping`. |
| `/missionism` | 200. Locked definition and protocol links. |
| `/principles`, `/how-it-works`, `/specification` | 200. Missionism protocol language remains. |
| Existing Work page | 200. Signed-out response shows the aggregate counts and does not include a private email or note. |
| `/api/health` | 200 ready |
| `/api/missions/health` | 200 ready |
| `/api/workspace/health` | 503 unavailable |

The existing Mission → Project → Work path remains reachable. No new Mission, interest, invitation, or confirmation was created for this check. Source (AGPL-3.0) is visible in the shell.
