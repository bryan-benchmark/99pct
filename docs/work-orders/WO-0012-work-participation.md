# WO-0012 — Mutual Work participation

## Goal

Extend the live loop from:

`Mission → Project → Work → expressed interest`

to:

`Mission → Project → Work → mutual participation`

A Mission creator may invite an already-interested human to help on a Work item. That human must separately confirm:

**I’ll help on this Work**

Only after both immutable actions exist may the product say that human is **helping on this Work**.

This is a collaboration record for later Contribution attribution. It is not Mission membership, employment, contractor status, a legal contract, compensation, an MCU grant, or ownership.

This order includes an additive production migration and exact-commit manual rollout after all repository and CI gates pass.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-013 through ADR-017 in `docs/DECISIONS.md`
- `docs/MISSION_PERSISTENCE.md`
- WO-0010 and WO-0011 implementation reports
- current Mission/Project/Work/interest routes, pages, persistence, grants, smoke, restore, health, and migration-prefix tests

## Branch

`wo/0012-work-participation`

## Hard boundaries

Do not:

- make the human a Mission member;
- create employment or contractor status;
- create or imply a legally binding contract;
- add compensation, pay rates, bounties, payroll, or payment rails;
- issue MCUs;
- issue or estimate legal ownership;
- create Contribution records;
- close a Work item when someone confirms;
- limit a Work item to only one confirmed helper;
- allow self-invitation;
- let the Mission creator confirm on behalf of the helper;
- invite a human who did not express interest in that Work;
- expose interested/participating verified email publicly;
- add destructive update/delete of invitation/confirmation history;
- use Workspace persistence;
- enable Firestore;
- change Cloud SQL tier/region/storage;
- change DNS/custom domain or WO-0006 / PR #11;
- enable automatic App Hosting rollouts;
- alter accepted migrations `0001`–`0004`;
- weaken additive-migration rollback compatibility;
- weaken dependency-security policy.

## 1. Add append-only invitation + confirmation persistence

Add the next checksum-tracked Mission migration.

Use two immutable tables.

### `work_invitations`

Suggested shape:

- `id UUID PRIMARY KEY`
- `interest_id UUID NOT NULL UNIQUE REFERENCES work_interests(id)`
- `invited_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

One Work-interest row may be invited at most once.

### `work_confirmations`

Suggested shape:

- `invitation_id UUID PRIMARY KEY REFERENCES work_invitations(id)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

The human identity for a confirmation is derived through:

`confirmation → invitation → interest → human_uid`

Do not duplicate a human uid into the confirmation row unless there is a concrete integrity reason.

Add database triggers rejecting UPDATE and DELETE on both tables.

This migration must be additive and backward-compatible with the retained WO-0011 build.

## 2. Derived participation state

Do not add a mutable status column.

Derive:

- **Interested** — interest exists, no invitation.
- **Invited** — invitation exists, no confirmation.
- **Helping** — invitation + confirmation both exist.

The absence of a confirmation is not a decline.

WO-0012 does not implement:

- decline;
- cancel;
- withdraw;
- remove helper;
- complete Work.

Multiple interests on the same Work may each become Helping.

Work itself stays `open`.

## 3. Creator invitation authorization

Only the Mission creator may create an invitation.

The server must prove:

1. verified human session;
2. valid public-origin CSRF;
3. target Mission/Project/Work path exists;
4. target interest exists on that exact Work item;
5. authenticated uid equals `missions.creator_uid`;
6. target interest belongs to a different human;
7. no invitation already exists for that interest.

Never accept creator uid or target human uid from client JSON as authority.

The client may identify the target through a non-secret interest/invitation identifier only if the server scopes it to the Work path. Prefer a route shaped around the interest id or another scoped opaque id.

Duplicate invitation must be deterministic and non-destructive. Prefer 409.

## 4. Human confirmation authorization

Only the human whose interest produced the invitation may confirm.

The server must prove:

1. verified human session;
2. valid public-origin CSRF;
3. Mission/Project/Work path exists;
4. invitation exists under that exact Work item;
5. invitation joins to an interest whose `human_uid` equals authenticated uid;
6. confirmation does not already exist.

The Mission creator cannot confirm on the helper’s behalf.

An unrelated signed-in human cannot confirm.

Duplicate confirmation must be deterministic and non-destructive. Prefer 409.

## 5. Creator invitation API

Add a protected route under the Work namespace, for example:

`POST /api/missions/[missionSlug]/projects/[projectSlug]/work/[workSlug]/interests/[interestId]/invite`

Input:

- CSRF token only.

On success return minimal private state such as:

`{"status":"invited"}`

No email/note needs to be echoed.

Required negative tests:

- signed out → rejected;
- bad origin/CSRF → rejected;
- non-creator → rejected;
- interest from another Work → rejected;
- unknown interest → rejected;
- duplicate invite → 409;
- creator cannot fabricate an invitation for a human who never expressed interest.

## 6. Helper confirmation API

Add a protected route, for example:

`POST /api/missions/[missionSlug]/projects/[projectSlug]/work/[workSlug]/participation/confirm`

The invitation is resolved from the authenticated human’s interest under the scoped Work path.

Input:

- CSRF token;
- explicit confirmation boolean if useful for client clarity.

Before submission show:

> I’ll help on this Work.

And boundary copy:

> This records that you and the Mission creator intend to work together on this item. It does not create employment, contractor status, a legal contract, compensation, MCUs, or ownership.

On success:

`{"status":"helping"}`

Required negative tests:

- signed out;
- bad CSRF/origin;
- no invitation;
- invitation for a different human;
- Mission creator attempting to confirm another human;
- duplicate confirmation.

## 7. Private creator view

Extend the creator-only Interested people panel.

For each interest show one derived state:

- **Interested**
- **Invited**
- **Helping**

For Interested:

**Invite to help**

For Invited:

Show:

**Invitation sent**

For Helping:

Show:

**Helping on this Work**

The creator may still see the interest email + private note because WO-0011 consented to that disclosure.

Do not add reject/decline/remove controls.

The invitation action must be server-authorized. UI hiding alone is insufficient.

## 8. Helper private view

A signed-in human who expressed interest sees exactly their own state.

### Interested, not invited

Keep:

**Interest sent**

No confirmation control yet.

### Invited, not confirmed

Show:

**You’re invited to help**

Button:

**I’ll help on this Work**

Show the non-contract boundary immediately before confirmation.

### Confirmed

Show:

**You’re helping on this Work**

Explain:

> Future contribution records for this Work can be tied to your participation.

Do not claim MCUs have been earned.

The helper must not see other interested humans or their statuses.

## 9. Public Work page

Public Work output may add only:

- aggregate `interestCount`;
- aggregate `helpingCount`.

Example:

- `3 people interested`
- `1 person helping`

Do not expose public participant identity yet.

Do not expose:

- verified email;
- Firebase uid;
- private interest note;
- invitation id;
- individual invitation state.

Keep the existing Work boundary that the posting itself is not a job or contract.

Once at least one helper is confirmed, the public page may truthfully say people are helping, but it must not call them employees, contractors, members, owners, or paid contributors.

## 10. Public/private query separation

Do not fold private participation rows into a broad public object beyond aggregate counts.

Use separate private query functions for:

- creator’s interest/invitation/helping list;
- signed-in human’s own participation state.

Tests must serialize public outputs and prove known:

- emails;
- Firebase uids;
- private notes;
- invitation ids

do not appear.

## 11. Runtime grants

Update Mission runtime grants.

Runtime privileges:

### `work_invitations`
- SELECT
- INSERT

### `work_confirmations`
- SELECT
- INSERT

No:

- UPDATE
- DELETE
- TRUNCATE
- REFERENCES
- TRIGGER
- table ownership

Update restricted-role checks.

Add negative PostgreSQL checks that UPDATE/DELETE of both tables fail.

## 12. CI / PostgreSQL smoke / restore

Extend the independent Mission PostgreSQL path.

CI must prove:

1. helper expresses interest;
2. creator invites that exact interest;
3. helper confirms;
4. derived state becomes Helping;
5. a second helper can independently become Helping on the same Work;
6. creator cannot invite an unrelated/no-interest human;
7. non-creator cannot invite;
8. creator cannot confirm for helper;
9. unrelated human cannot confirm;
10. duplicate invitation/confirmation cannot create extra rows;
11. public query exposes counts only;
12. private creator/helper queries enforce authorization;
13. UPDATE/DELETE rejected;
14. logical backup + restore preserves interest, invitation, and confirmation history;
15. migration/environment records survive restore.

Workspace DB CI stays independently green.

## 13. Production-safe no-persist check

Extend `mission:prod-check` so transaction/rollback evidence covers:

- interest;
- invitation;
- confirmation;
- immutable mutation rejection.

Counts before/after must remain equal.

Do not persist production-check rows.

## 14. Product tests

Cover at minimum:

- creator invite succeeds;
- non-creator invite fails;
- no-interest invite impossible;
- cross-Work invitation mismatch fails;
- duplicate invite behavior;
- helper confirm succeeds;
- creator confirm fails;
- unrelated human confirm fails;
- confirmation without invitation fails;
- duplicate confirmation behavior;
- derived Interested → Invited → Helping state;
- multiple helpers can confirm on one Work;
- public helping count;
- public privacy;
- helper sees only own state;
- creator sees private statuses;
- no employment/contract/pay/MCU/equity copy claim;
- immutable triggers;
- existing auth/Mission/Project/Work/interest tests remain green.

## 15. Documentation

Update `docs/DATA_MODEL.md` narrowly:

- interest;
- invitation;
- confirmation;
- derived participation;
- no Mission membership/legal contract.

Update `docs/MISSION_PERSISTENCE.md` for new tables/grants and additive migration compatibility.

Do not rewrite unrelated protocol docs.

## 16. Pre-production gates

Before production migration:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`
- both required GitHub Actions jobs green

Deployment candidate must be an exact green commit.

## 17. Production migration ordering

Follow the additive compatibility rule.

1. apply the pending migration with the migration identity;
2. while WO-0011 build `build-2026-10-04-013` is still serving, verify `/api/missions/health` remains ready;
3. reassert environment binding;
4. reapply runtime grants;
5. restricted-role check;
6. production no-persist check;
7. only then roll out the application.

If build-013 becomes unhealthy merely because the additive migration exists, stop.

Do not reverse the migration after live invitation/confirmation rows exist.

## 18. Manual App Hosting rollout

Automatic rollouts stay off.

Manually promote the exact green WO-0012 commit to backend `pct99`.

Record:

- commit;
- build id;
- state;
- generated URL;
- automatic rollout state.

Retain build-013 as application rollback target.

## 19. Live journey

Use the existing WO-0010 test Work and WO-0011 interested human if possible.

Prove:

1. signed-out page exposes only public counts;
2. creator signs in and sees the existing interested human;
3. creator chooses **Invite to help**;
4. creator view changes to **Invitation sent**;
5. interested human signs in and sees **You’re invited to help**;
6. human confirms **I’ll help on this Work**;
7. their view changes to **You’re helping on this Work**;
8. creator view changes to **Helping on this Work**;
9. signed-out page shows aggregate helping count only;
10. no email/note/invitation id appears publicly;
11. duplicate invite/confirm actions are refused/non-destructive;
12. creator cannot confirm on the human’s behalf.

Keep labeled alpha rows. Do not destructively clean immutable history.

## 20. Post-live operational checks

Verify:

- Mission DB health ready;
- runtime role checker passes;
- environment binding matches;
- backups/PITR/deletion protection remain enabled;
- automatic rollouts off;
- retained build-013 stays schema-compatible;
- no migration/admin secret exposed;
- no DNS/custom-domain/predecessor/Workspace change.

## 21. Rollback

Application rollback may return to build-013.

Because the migration is additive/backward-compatible, build-013 Mission health must remain ready and simply ignore invitation/confirmation tables.

Do not reverse the migration after live rows exist.

Database recovery remains backup/PITR only for real incidents.

## 22. Durable report

Create:

`docs/implementation-reports/WO-0012-work-participation.md`

Include:

- schema summary;
- derived state model;
- creator/helper authorization;
- privacy boundary;
- runtime grants;
- CI;
- migration-before-rollout health proof;
- deployed commit/build;
- live mutual participation journey without reproducing private email/note;
- public aggregate/privacy checks;
- backup/PITR/deletion-protection state;
- rollback compatibility;
- confirmation that no membership/employment/contract/pay/Contribution/MCU/equity/domain/predecessor/Workspace changes occurred.

Do not include credentials, cookies, verification links, private emails, private notes, secret values, or Firebase uids.

## Acceptance

1. Creator can invite only an existing interest on their own Work.
2. Interested human must separately confirm their own invitation.
3. Creator cannot confirm on behalf of a helper.
4. Human cannot self-invite.
5. Duplicate invitation and confirmation are non-destructive.
6. Invitation and confirmation history are immutable.
7. Multiple humans can be Helping on one Work.
8. Work stays open.
9. Public output exposes aggregate helping count only.
10. Private identities/statuses are correctly authorized.
11. UI does not imply membership, employment, contractor status, legal contract, compensation, MCU, or ownership.
12. Runtime DB grants remain least privilege.
13. PostgreSQL CI + backup/restore covers both new tables.
14. Additive migration leaves serving WO-0011 build healthy before rollout.
15. Exact green commit is manually deployed with automatic rollouts off.
16. Live creator invite → helper confirm journey succeeds.
17. Mission health/backups/PITR/deletion protection remain healthy.
18. No custom-domain/DNS, predecessor, Workspace DB, Firestore, Contribution, MCU, equity, or payment behavior changes.

## Return

Open the PR with all evidence and stop.

Do not implement Contribution.
Do not implement MCUs.
Do not add formal contracts.
Do not resume WO-0006.
