# WO-0010 — Projects and needed Work

## Result

The live loop is now Mission → Project → Work on the existing Mission database and the existing `pct99` backend.

- Pull request: https://github.com/bryan-benchmark/99pct/pull/19
- Deployed commit: `de3bdf5e35be41c9034c0c3265367f76bd674bf3`
- Build: `build-2026-10-04-012`, state `READY`
- URL: `https://pct99--pct-99.us-central1.hosted.app`
- Automatic rollouts: off (`rolloutPolicy` null)
- Previous successful build retained: `build-2026-10-04-011` of `1b3c7dc`
- Earlier product rollback build retained: `build-2026-10-04-010` of `efc6a26`

Posting Work does not create employment, a contract, pay, an MCU award, or ownership. Join was not started.

## Migration and schema

`0001_missions.sql` and `0002_environment.sql` were not edited.

`0003_projects_work.sql` adds:

| Table | Rule |
|---|---|
| `projects` | One bounded outcome of one Mission. Status `active` only. Slug unique within the Mission. |
| `project_revisions` | Append-only title and outcome. Updates and deletes are rejected. |
| `work_items` | One `task` or `role` under one Project. Status `open` only. Slug unique within the Project. |
| `work_revisions` | Append-only title, description, and done-when. Updates and deletes are rejected. |

Length checks match the server validators. The Mission creator is the only writer until Join exists. Public queries do not select the creator email or Firebase uid.

## Authorization

`POST /api/missions/[slug]/projects` and `POST /api/missions/[slug]/projects/[projectSlug]/work` use the public-origin CSRF rule, require a verified human session, validate the draft before opening the database, and compare the session uid with `missions.creator_uid`. A uid in the JSON body is ignored. Work creation also requires the Project to belong to that Mission.

Signed-out create routes redirect to sign-in with a return path. An authenticated non-creator receives 404 on the create pages. Server tests cover signed-out rejection, non-creator rejection, a cross-Mission mismatch, and an invalid origin.

## Grants

The runtime role gained SELECT and INSERT on `projects`, `project_revisions`, `work_items`, and `work_revisions`. It still has no table-wide UPDATE, DELETE, TRUNCATE, REFERENCES, or TRIGGER, and it does not own the tables. Column UPDATE remains limited to `human_accounts.verified_email`.

## CI

GitHub Actions run `37230406673` passed both jobs on `1b3c7dccc71a21c7d3571fbf319b2c43b612c340`:

- functional, including Mission migrate, bind, restricted-role check, Project/Work smoke, logical backup, and restore
- dependency-security

An earlier run, `37230201470`, failed only because the smoke user id was the same text as the public Mission slug. That assertion was corrected before the production migration. Workspace PostgreSQL checks stayed green.

The health compatibility correction was CI run `37231560899` on `de3bdf5e35be41c9034c0c3265367f76bd674bf3`. Both jobs passed. That commit was rolled out as `build-2026-10-04-012`. `/api/missions/health` stayed `{"status":"ready"}`. No schema or production rows changed. A fixture checks the WO-0009 migration set (`0001` and `0002`) against a database that already includes `0003`. Live traffic was not rolled back to `build-2026-10-04-010`; that already-built binary still uses exact migration equality.

Local `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed before the pull request. Audit policy remained `high=9 moderate=0 critical=0`.

## Production migration

Using the existing `missions_migrate` identity through the Cloud SQL Auth Proxy:

1. The pending migration applied. `mission_schema_migrations` now lists `0001_missions.sql`, `0002_environment.sql`, and `0003_projects_work.sql`.
2. Environment binding was already bound and stayed `production` / `pct-99` / `missions` / `pct-99:us-central1:pct99-missions-prod`.
3. Runtime grants were reapplied.
4. `missions_runtime` passed the restricted-role check.
5. `npm run mission:prod-check` rolled back its inserts and rejected revision updates. Counts were unchanged.
6. No operator SQL wrote a lasting Project or Work row.

The first serving build required the database migration list to match its bundled files exactly, so `/api/missions/health` returned unavailable after `0003` landed and before `build-2026-10-04-011` was serving. Health now accepts a database that is ahead by later additive migrations. A migration known to the running build still fails health when it is missing, reordered, or checksum-changed. The migration command itself still refuses a history that is not a prefix of the files it is running. The instance, tier, region, and storage were not changed.

## Live journey

The existing verified WO-0009 test account created these records on `WO-0009 test Mission`:

- Project `WO-0010 test Project` at `/missions/wo-0009-test-mission/projects/wo-0010-test-project`
- Task `WO-0010 test task` at `/missions/wo-0009-test-mission/projects/wo-0010-test-project/work/wo-0010-test-task`

While signed in, the Mission page showed the Project, its outcome, and `1 open work item`, plus `Create a Project`. The Project page showed Active, the outcome, the Task, and `Post needed Work`. The Work page showed Task, the description, done-when, Open, and `Joining this work is not available yet.`

After sign-out, unsigned requests still returned all three pages. They did not show `Create a Project`, `Post needed Work`, Apply, or a join action. The HTML did not contain the creator email. Contribution, ownership, and governance rails stayed empty. The labeled records were kept.

## Operational state after the live write

- `GET /api/missions/health` returned 200 `{"status":"ready"}`.
- `GET /` and `GET /missions` returned 200.
- The runtime role check passed again.
- Backups enabled, 7 retained, point-in-time recovery enabled, deletion protection enabled, instance `RUNNABLE`, tier unchanged.
- Automatic rollouts remain off.
- `apphosting.yaml` still references only `mission-db-password` for the serving runtime.
- Workspace health stayed unavailable, which is the existing separate path.
- DNS, `99pct.com`, the predecessor Missionism project, and the Workspace database were not changed.

## Rollback

If this health correction fails, roll the backend back to `build-2026-10-04-011` (`1b3c7dc`). That build includes `0003`, so its exact migration check still matches the database. Do not reverse `0003` after the live Project and Work rows exist. `build-2026-10-04-010` remains available and does not read the new tables, but that already-built binary still requires an exact migration list, so Mission health would report unavailable if traffic returned to it. From `build-2026-10-04-012` forward, a retained build stays ready when the database is ahead only by later additive migrations, and stays unavailable if a migration that build knows is missing, reordered, or checksum-changed. Production migrations must stay backward-compatible with the retained rollback build. Backups and point-in-time recovery remain incident recovery, not the ordinary rollback.

## Left unchanged

Join, Contribution, MCU grants, equity issuance, custom-domain work, and WO-0006 stayed out of this change.
