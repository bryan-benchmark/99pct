# WO-0012 — Mutual Work participation

## Result

A Mission creator can invite a human who already expressed interest. That human must separately confirm “I’ll help on this Work.” Only after both immutable rows exist does the product say the human is helping. This is not Mission membership, employment, contractor status, a legal contract, compensation, a Contribution record, an MCU grant, or ownership.

- Pull request: https://github.com/bryan-benchmark/99pct/pull/23
- Deployed commit: `28e2ff2c3277140a3562bf6bebb1e7a3ebdd776b`
- Build: `build-2026-10-04-014`, state `READY`
- URL: `https://pct99--pct-99.us-central1.hosted.app`
- Automatic rollouts: off (`rolloutPolicy` null)
- Retained application rollback: `build-2026-10-04-013` of `1c3f4f496c8b1762c0c5401bbae461328c114b8d`

## Schema and derived state

`0001` through `0004` were not edited.

`0005_work_participation.sql` adds two tables:

| Table | Rule |
|---|---|
| `work_invitations` | One invitation per interest. The Mission creator is `invited_by_uid`. |
| `work_confirmations` | One confirmation per invitation. The human is the interest behind that invitation. |

Update and delete triggers reject changes. There is no participation status column.

Derived state:

- **Interested** — interest only
- **Invited** — invitation, no confirmation
- **Helping** — invitation and confirmation

The absence of a confirmation is not a decline. Work stays `open`. More than one human can be helping on the same Work item.

## Authorization and privacy

`POST .../interests/[interestId]/invite` accepts only a CSRF token. The server checks the verified session, proves the caller is the Mission creator, and invites only an interest on that exact Work item that belongs to someone else. A duplicate invitation returns 409 “An invitation was already sent.” Success is 201 `{"status":"invited"}`.

`POST .../participation/confirm` resolves the invitation from the signed-in human’s own interest. `confirm` must be boolean true before the database opens. The Mission creator cannot confirm for someone else. A duplicate confirmation returns 409 “Help was already confirmed.” Success is 201 `{"status":"helping"}`.

Public Work data adds only `helpingCount` beside the existing interest count. Emails, notes, Firebase uids, and invitation ids stay off the public page. The creator still sees the consented email and note, plus Interested, Invited, or Helping. The helper sees only their own state.

## Grants

The runtime role gained SELECT and INSERT on `work_invitations` and `work_confirmations`. It still has no table-wide UPDATE, DELETE, TRUNCATE, REFERENCES, or TRIGGER, and it does not own the tables. Column UPDATE remains limited to `human_accounts.verified_email`.

## CI

GitHub Actions run `37234311730` passed both jobs on `28e2ff2c3277140a3562bf6bebb1e7a3ebdd776b`:

- functional, including Mission migrate, bind, restricted-role check, participation smoke, logical backup, and restore
- dependency-security

Local `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed before the pull request. Audit policy remained `high=9 moderate=0 critical=0`.

## Migration before rollout

`0005_work_participation.sql` was applied with `missions_migrate` while `build-2026-10-04-013` was still serving.

1. Before the migration, `GET /api/missions/health` returned 200 `{"status":"ready"}`.
2. The migration list then included `0005_work_participation.sql`.
3. The same health endpoint, still served by `build-2026-10-04-013`, returned 200 `{"status":"ready"}`.
4. Environment binding was already bound and stayed `production` / `pct-99` / `missions` / `pct-99:us-central1:pct99-missions-prod`.
5. Runtime grants were reapplied. `missions_runtime` passed the restricted-role check.
6. `npm run mission:prod-check` rolled back its inserts. Counts were unchanged. Invitations and confirmations were still 0.
7. Only then was `28e2ff2c3277140a3562bf6bebb1e7a3ebdd776b` rolled out as `build-2026-10-04-014`.

The instance, tier, region, and storage were not changed. The migration was not reversed.

## Live journey

On the existing Work item `/missions/wo-0009-test-mission/projects/wo-0010-test-project/work/wo-0010-test-task`:

- A signed-out response showed `1 person interested` and did not show a helping count, an email, a note, or an invitation control.
- The Mission creator saw the existing interested human as **Interested** and chose **Invite to help**. The view changed to **Invitation sent**.
- A second invite returned 409. The creator’s own confirmation request returned 404 “No invitation was found.”
- The interested human saw **You’re invited to help**, the non-contract boundary, and **I’ll help on this Work**. After confirming, the view changed to **You’re helping on this Work**, including the sentence that future contribution records can be tied to that participation. It did not say MCUs were earned, and it did not show another person’s state.
- A second confirmation returned 409.
- After sign-out, the page showed `1 person interested` and `1 person helping`. It did not show the email, the note, the invitation id, or **Interested people**.
- The creator signed in again and saw **Helping on this Work**, with no further invite control. The Work stayed Open.

The labeled interest, invitation, and confirmation were kept. The test email and note are not recorded here.

## Operational state after the live write

- `GET /api/missions/health` returned 200 `{"status":"ready"}`.
- Backups enabled, 7 retained, point-in-time recovery enabled, deletion protection enabled, instance `RUNNABLE`, tier `db-f1-micro`, region `us-central1`.
- Automatic rollouts remain off.
- The migration and admin secrets have no IAM bindings.
- `build-2026-10-04-013` remains the rollback target. Its health stayed ready after `0005` because that build accepts a later additive migration.
- DNS, the predecessor Missionism project, and the Workspace database were not changed.

## Rollback

If this release fails, roll the backend back to `build-2026-10-04-013` (`1c3f4f4`). That build’s Mission health stays ready against a database that includes invitations and confirmations, and that build ignores those tables. Do not reverse `0005` after the live invitation and confirmation exist. Database recovery remains backup and point-in-time recovery for a real incident.

## Left unchanged

Contribution records, MCU grants, equity issuance, formal contracts, pay, custom-domain work, and WO-0006 stayed out of this change.
