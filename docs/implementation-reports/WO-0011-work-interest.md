# WO-0011 — “I want to help” / Work interest

## Result

A verified human who is not the Mission creator can express interest in one open Work item. The interest is one immutable row. It does not create Mission membership, Work assignment, employment, a contract, compensation, an MCU grant, ownership, or guaranteed acceptance.

- Pull request: https://github.com/bryan-benchmark/99pct/pull/21
- Deployed commit: `1c3f4f496c8b1762c0c5401bbae461328c114b8d`
- Build: `build-2026-10-04-013`, state `READY`
- URL: `https://pct99--pct-99.us-central1.hosted.app`
- Automatic rollouts: off (`rolloutPolicy` null)
- Retained application rollback: `build-2026-10-04-012` of `de3bdf5e35be41c9034c0c3265367f76bd674bf3`

## Schema and privacy

`0001_missions.sql`, `0002_environment.sql`, and `0003_projects_work.sql` were not edited.

`0004_work_interests.sql` adds one table, `work_interests`:

| Column | Rule |
|---|---|
| `id` | UUID primary key |
| `work_id` | Work item |
| `human_uid` | Verified human |
| `private_note` | Required text, default empty, at most 500 characters |
| `email_share_consented` | Must be true |
| `created_at` | When the interest was expressed |

`(work_id, human_uid)` is unique. Update and delete triggers reject changes with `work interests are append-only`. The current verified email stays on `human_accounts`; the interest row does not copy it.

Public Work data adds only `interestCount`. The verified email and private note are visible to the interested human and the Mission creator. The interested human’s own view returns the note and time, not the email. The creator view returns the email, note, and time, not the Firebase uid. An unrelated signed-in human cannot read either private view.

## Consent and authorization

`POST /api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/interest` uses the public-origin CSRF rule, requires a verified human session, and validates the draft before opening the database. Consent must be the boolean `true`. The checkbox is required and is not pre-checked. Its label is: “Share my verified email with this Mission's creator so they can follow up.”

The form states: “This only expresses interest. It does not create a job, contract, assignment, compensation, MCUs, or ownership.”

The route rejects a signed-out caller, a bad origin, missing or false consent, a Mission creator, a cross-Mission mismatch, and an oversized note. A uid or email in the JSON body is ignored. A second interest for the same human and Work returns 409 “Interest was already sent.” and does not insert another row. Success is 201 with only `{"status":"interested"}`.

## Grants

The runtime role gained SELECT and INSERT on `work_interests`. It still has no table-wide UPDATE, DELETE, TRUNCATE, REFERENCES, or TRIGGER, and it does not own the table. Column UPDATE remains limited to `human_accounts.verified_email`.

## CI

GitHub Actions run `37232776128` passed both jobs on `1c3f4f496c8b1762c0c5401bbae461328c114b8d`:

- functional, including Mission migrate, bind, restricted-role check, interest smoke, logical backup, and restore
- dependency-security

Local `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed before the pull request. Audit policy remained `high=9 moderate=0 critical=0`.

## Migration before rollout

`0004_work_interests.sql` was applied with `missions_migrate` while `build-2026-10-04-012` was still serving.

1. Before the migration, `GET /api/missions/health` returned 200 `{"status":"ready"}`.
2. The migration list became `0001_missions.sql`, `0002_environment.sql`, `0003_projects_work.sql`, and `0004_work_interests.sql`.
3. The same health endpoint, still served by `build-2026-10-04-012`, returned 200 `{"status":"ready"}`.
4. Environment binding was already bound and stayed `production` / `pct-99` / `missions` / `pct-99:us-central1:pct99-missions-prod`.
5. Runtime grants were reapplied. `missions_runtime` passed the restricted-role check.
6. `npm run mission:prod-check` rolled back its inserts. Mission, account, project, work, and interest counts were unchanged, and the interest count was 0.
7. Only then was `1c3f4f496c8b1762c0c5401bbae461328c114b8d` rolled out as `build-2026-10-04-013`.

The instance, tier, region, and storage were not changed. The migration was not reversed.

## Live journey

On the existing Work item `/missions/wo-0009-test-mission/projects/wo-0010-test-project/work/wo-0010-test-task`:

- A signed-out visitor saw the public Work page, `I want to help` linking to sign-in with that return path, and no interest count, email, or note.
- A second verified human signed in, saw `I want to help`, the consent checkbox unchecked, and the interest boundary. Submitting without consent stayed on the form. After checking consent and sending one private note, the page showed `Interest sent` and that person’s own note. It did not show the email, a second form, or a withdraw action.
- A second submit returned 409 “Interest was already sent.” The table still has one interest row.
- After sign-out, the page showed `1 person interested` and `I want to help`. It did not show the email, the note, or `Interested people`.
- The Mission creator signed in and saw `Interested people` with the interested email, the private note, and the expressed-at date. The creator did not see `I want to help`. A creator submit returned 403 “The Mission creator cannot express interest in this Work.”

The labeled interest row was kept. The test email and note are not recorded here.

## Operational state after the live write

- `GET /api/missions/health` returned 200 `{"status":"ready"}`.
- The runtime role check had passed after grants and before rollout.
- Backups enabled, 7 retained, point-in-time recovery enabled, deletion protection enabled, instance `RUNNABLE`, tier `db-f1-micro`, region `us-central1`.
- Automatic rollouts remain off.
- The serving runtime still has access only to `mission-db-password`. The migration and admin secrets have no IAM bindings.
- `build-2026-10-04-012` remains the rollback target. Its health stayed ready after `0004` because that build accepts a later additive migration.
- DNS for `99pct.com` was not changed. The predecessor Missionism project and the Workspace database were not changed.

## Rollback

If this release fails, roll the backend back to `build-2026-10-04-012` (`de3bdf5`). That build’s Mission health stays ready against a database that includes `work_interests`, and that build ignores interest rows. Do not reverse `0004` after the live interest row exists. `build-2026-10-04-011` and `build-2026-10-04-010` still use exact migration equality, so returning traffic to either would make Mission health unavailable. Database recovery remains backup and point-in-time recovery for a real incident.

## Left unchanged

Accepting or declining interest, assignment, Contribution, MCU grants, equity issuance, custom-domain work, and WO-0006 stayed out of this change.
