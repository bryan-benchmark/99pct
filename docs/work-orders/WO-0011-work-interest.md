# WO-0011 — I want to help: Work interest

## Goal

Extend the live product loop from:

`Mission → Project → Work`

to:

`Mission → Project → Work → expressed interest`

A verified human can tell the Mission creator:

**I want to help**

on one open Work item.

This is interest only. It does not create Mission membership, Work assignment, employment, contractor status, a contract, compensation, an MCU grant, ownership, or guaranteed acceptance.

This order includes an additive production migration and exact-commit manual rollout after all repository and CI gates pass.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-013 through ADR-016 in `docs/DECISIONS.md`
- `docs/MISSION_PERSISTENCE.md`
- WO-0010 implementation report
- current Mission/Project/Work routes, pages, DB grants, smoke, restore, health, and migration-prefix tests

## Branch

`wo/0011-work-interest`

## Hard boundaries

Do not:

- make an interested human a Mission member;
- assign Work;
- accept or decline interest;
- generate a contract;
- promise or record compensation;
- issue MCUs;
- issue or estimate ownership;
- add payment rails;
- expose interested-human email or note publicly;
- let the Mission creator express interest in their own Mission's Work;
- allow more than one initial interest per human + Work;
- add destructive update/delete of interest history;
- use Workspace persistence;
- enable Firestore;
- change Cloud SQL tier/region/storage;
- modify WO-0006 / PR #11;
- change DNS/custom domains;
- enable automatic App Hosting rollouts;
- alter accepted migrations `0001`–`0003`;
- weaken the additive-migration rollback compatibility rule;
- weaken dependency-security policy.

## 1. Add immutable Work interest persistence

Add the next checksum-tracked Mission migration.

Use a single immutable table such as:

### `work_interests`

- `id UUID PRIMARY KEY`
- `work_id UUID NOT NULL REFERENCES work_items(id)`
- `human_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `private_note TEXT NOT NULL DEFAULT ''`
- `email_share_consented BOOLEAN NOT NULL CHECK (email_share_consented = TRUE)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique `(work_id, human_uid)`

Private-note length must be constrained in both DB and server validation. Suggested max: 500 characters.

Add triggers rejecting UPDATE and DELETE.

Do not store a duplicate email snapshot in this table. The current verified email remains in `human_accounts`.

This migration must be additive and backward-compatible with the currently retained WO-0010 build.

## 2. Interest semantics

One human may express interest at most once per Work item.

Initial state is implicit: the presence of the immutable row means `interested`.

There is no:

- pending/accepted/declined status;
- withdrawal;
- assignment;
- contract state.

Those are future slices.

The Mission creator may not express interest in Work belonging to their own Mission.

A human may express interest in Work from any other Mission if the Work is still `open`.

## 3. Explicit privacy consent

The action must explicitly state before submission:

> Share my verified email with this Mission's creator so they can follow up.

Consent must be affirmative. Do not pre-check it.

The server must reject the request unless consent is true.

Also say once:

> This only tells the Mission creator you're interested. It does not create a job, contract, compensation, MCUs, ownership, or assignment.

An optional note may be submitted, such as why the person wants to help or relevant context.

The note is private to:

- the interested human;
- the Mission creator.

It must never appear in public Work responses/pages.

## 4. Protected interest API

Add a route under the existing Work namespace, for example:

`POST /api/missions/[missionSlug]/projects/[projectSlug]/work/[workSlug]/interest`

Input:

- optional private note;
- `shareEmail: true`;
- CSRF token.

Required server checks:

1. valid public-origin CSRF;
2. verified human session;
3. input parsed/validated before avoidable DB access;
4. Mission/Project/Work relationship exists;
5. Work status is `open`;
6. authenticated human is not the Mission creator;
7. explicit email-share consent is true;
8. no existing interest for that human + Work.

Never accept uid/email/creator identity from request JSON.

On success return only a minimal non-private state, e.g. `{"status":"interested"}`.

A duplicate should be deterministic and non-destructive. Prefer 409 or an idempotent already-interested response; choose one behavior and test it.

### Negative tests

Prove:

- signed-out request rejected;
- invalid CSRF/origin rejected;
- false/missing email consent rejected;
- Mission creator rejected;
- cross-Mission/project/work mismatch rejected;
- duplicate interest cannot create two rows;
- invalid oversized note rejected before DB open where practical.

## 5. Public Work page

Replace:

`Joining this work is not available yet.`

with the real interest surface.

### Signed out

Primary action:

**I want to help**

→ sign in preserving return path.

### Signed in, non-creator, not yet interested

Show:

**I want to help**

Opening/submitting the interest form must show the email-sharing consent and legal/economic boundary.

### Signed in, already interested

Show a calm state:

**Interest sent**

and explain that the Mission creator can now see the verified email and private note.

Do not add cancel/withdraw in this slice.

### Mission creator

Do not show an “I want to help” action for their own Work.

Instead show the private interested-human panel described below.

### Public aggregate

The public Work page may show:

- `1 person interested`
- `N people interested`

derived from recorded rows.

Never expose public names/emails/uids/notes.

## 6. Interest form

Use the Work page or a focused route/modal; keep it simple.

Fields:

### Private note — optional
Prompt:
“Anything you want the Mission creator to know?”

Max 500 characters.

### Required consent
Unchecked checkbox:

“Share my verified email with this Mission's creator so they can follow up.”

Boundary copy:

“This only expresses interest. It does not create a job, contract, assignment, compensation, MCUs, or ownership.”

Submit:

**Send interest**

On success return to the Work page.

## 7. Creator-private interest view

On the Work page, if the authenticated viewer is the Mission creator, show a private section:

### Interested people

For each interest:

- verified email;
- private note if present;
- expressed-at timestamp.

Do not show Firebase uid.

If none:

`No one has expressed interest yet.`

This section must be server-authorized. Hiding it in the UI is not sufficient.

A non-creator authenticated user must not be able to obtain another person's email/note through:

- the page;
- a route;
- public data methods;
- manipulated URL parameters.

Prefer a dedicated private query that requires creator uid and verifies ownership in SQL/application logic.

## 8. Interested-human private state

The interested human may see their own interest state on the Work page.

They may see:

- that interest was sent;
- their own private note;
- that their verified email was shared with the Mission creator.

They must not see other interested humans' private emails/notes.

## 9. Public/private query separation

Public Work types/queries may add only aggregate count/state that is safe publicly.

Do not put private interest rows into a broad `PublicWork` object.

Create separate private types/functions for:

- viewer's own interest;
- creator's interested-human list.

Tests must serialize public outputs and prove known:

- verified emails;
- Firebase uids;
- private notes

are absent.

## 10. Runtime grants

Update the Mission runtime grant script.

`work_interests` runtime privileges:

- SELECT
- INSERT

No:

- UPDATE
- DELETE
- TRUNCATE
- REFERENCES
- TRIGGER
- ownership

The runtime-role checker must include the table.

Add PostgreSQL negative checks that UPDATE/DELETE are refused.

Because private creator views need SELECT, the application server—not DB role alone—must enforce who may receive private rows.

## 11. Production-safe test tooling

Extend:

- Mission PostgreSQL smoke;
- production no-persist check;
- logical backup/restore comparison.

CI must prove:

1. a non-creator test human can create interest;
2. Mission creator cannot;
3. duplicate cannot create a second row;
4. public Work data exposes only interest count;
5. creator-private query returns email/note only when creator authorization matches;
6. non-creator private query is refused;
7. UPDATE/DELETE rejected;
8. backup/restore preserves the immutable interest.

Do not leave production-safe test rows behind.

## 12. Application tests

Cover at minimum:

- note length and normalization;
- missing consent;
- signed-out refusal;
- CSRF/origin refusal;
- creator refusal;
- valid non-creator interest;
- duplicate behavior;
- wrong Mission/Project/Work path refusal;
- public aggregate count;
- public privacy;
- interested human sees only own state;
- creator sees interested email/note;
- unrelated authenticated human cannot see private interest;
- immutable DB trigger;
- existing Mission/Project/Work/Auth tests remain green.

## 13. Update copy carefully

The Work page boundary should evolve from “joining is unavailable” to the real state.

Use plain language:

- “I want to help”
- “Interest sent”
- “Interested people”

Avoid:

- Apply
- Applicant
- Hired
- Candidate
- Employee
- Contractor
- Assigned
- Member

until those states genuinely exist.

Keep the existing statement that open Work is not a binding job or contract.

## 14. Documentation

Update `docs/DATA_MODEL.md` narrowly:

- add immutable Work interest;
- note verified email/private note privacy boundary;
- note interest is not membership/assignment/contract.

Update `docs/MISSION_PERSISTENCE.md` only as needed for the new table/grants/release compatibility.

## 15. Pre-production gates

Before migration:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`
- both required GitHub Actions jobs green

Deployment candidate must be an exact green commit.

## 16. Production migration ordering

Use the corrected additive migration contract from WO-0010.

Sequence:

1. apply the pending additive Mission migration using migration identity;
2. while the existing WO-0010 build is still serving, verify `/api/missions/health` **remains ready**;
3. reassert environment binding;
4. reapply runtime grants;
5. runtime-role check;
6. production no-persist check;
7. only then proceed to application rollout.

If the currently serving WO-0010 build becomes unhealthy merely because the additive migration was applied, stop. Do not deploy around the failure.

Do not reverse the migration after live rows exist.

## 17. Manual App Hosting rollout

Automatic rollouts remain off.

Manually promote the exact green WO-0011 commit.

Record:

- commit;
- build id;
- state;
- generated URL;
- automatic rollout state.

Retain the WO-0010 build as the application rollback target.

## 18. Live journey

Use the existing WO-0010 Work item if possible.

Need two identities:

- Mission creator test account;
- a separate verified human test account.

Prove:

1. signed-out visitor sees public Work but no private interest data;
2. second human signs in;
3. sees “I want to help”;
4. form requires explicit email-sharing consent;
5. submits one clearly labeled private note;
6. Work page shows “Interest sent”;
7. signed out page shows only aggregate interest count;
8. Mission creator signs in;
9. creator sees the interested human's verified email + private note;
10. unrelated public/signed-out view does not;
11. duplicate submission cannot create a second interest;
12. creator cannot submit interest in their own Work.

Do not put the test email or private note in the durable report. Describe the evidence without reproducing PII.

Keep the labeled alpha interest row rather than destructively deleting immutable history.

## 19. Post-live operational checks

Verify:

- `/api/missions/health` ready;
- runtime role checker passes;
- environment binding matches;
- backup/PITR/deletion protection remain enabled;
- automatic rollouts off;
- retained WO-0010 build remains schema-compatible by the prefix contract;
- no migration/admin secret exposed to runtime;
- no DNS/custom-domain/Workspace/predecessor changes.

## 20. Rollback

Application rollback may return to the retained WO-0010 build.

Because migration is additive/backward-compatible, its Mission health must remain ready against the DB that now includes the Work-interest table.

The old app will simply ignore interests.

Do not reverse the schema migration after interest rows exist.

Database recovery remains backup/PITR only for real incidents.

## 21. Durable report

Create:

`docs/implementation-reports/WO-0011-work-interest.md`

Include:

- schema/migration summary;
- privacy/consent model;
- creator/non-creator authorization;
- duplicate behavior;
- runtime-grant changes;
- CI;
- migration-before-rollout health proof;
- deployed commit/build;
- live interest journey without reproducing private email/note;
- public privacy checks;
- backup/PITR/deletion-protection state;
- rollback compatibility;
- confirmation no assignment/membership/contract/pay/MCU/equity/domain/predecessor/Workspace changes occurred.

Do not include credentials, cookies, verification links, private email addresses, private note contents, or secret values.

## Acceptance

1. Verified non-creator can express interest in one open Work item.
2. Explicit email-sharing consent is required.
3. Mission creator cannot express interest in own Work.
4. Duplicate interest cannot create a second row.
5. Interest is immutable.
6. Public Work output exposes only safe aggregate state.
7. Mission creator can privately see interested human email + note.
8. Interested human can see their own state but not others' private data.
9. Unrelated humans cannot obtain private interest data server-side.
10. UI does not imply membership, assignment, employment, contract, compensation, MCU, or ownership.
11. Runtime DB grants remain least privilege.
12. PostgreSQL CI + backup/restore includes Work interest.
13. Additive production migration leaves the previously serving WO-0010 build healthy before new rollout.
14. Exact green commit is manually deployed with automatic rollouts off.
15. Live “I want to help” journey succeeds.
16. Mission DB health/backups/PITR/deletion protection remain healthy.
17. No custom-domain/DNS, predecessor, Workspace DB, Firestore, assignment, Contribution, MCU, equity, or payment behavior changes.

## Return

Open the PR with all evidence and stop.

Do not implement acceptance/assignment.
Do not implement Contribution or MCUs.
Do not resume WO-0006.
