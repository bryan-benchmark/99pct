# WO-0010 — Projects + needed Work

## Goal

Extend the live 99pct product loop from:

`Mission`

to:

`Mission → Project → Work`

A verified Mission creator can create a bounded Project and publish the Work that Project needs. Anyone can discover/read the resulting Project and Work without an account.

This order includes the production migration and exact-commit App Hosting rollout after repository/CI review gates pass.

It does **not** implement Join, acceptance, contracts, compensation, Contribution records, MCUs, equity, governance, or custom-domain work.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-013, ADR-014, ADR-015 in `docs/DECISIONS.md`
- `docs/MISSION_PERSISTENCE.md`
- `docs/implementation-reports/WO-0009-provision-and-deploy-missions.md`
- current Mission model/store/routes/pages
- current Mission migration/runtime-grant/smoke/restore tooling

## Branch

`wo/0010-projects-and-work`

## Hard boundaries

Do not:

- implement Join or membership;
- let arbitrary authenticated humans create content inside another person's Mission;
- create employment or contractor agreements;
- add compensation, pay rates, bounty amounts, wallets, cash balances, or payment rails;
- issue or estimate MCUs;
- issue or estimate legal ownership;
- add a contract generator;
- add governance/voting;
- allow destructive edits of Project/Work descriptive history;
- enable Firestore;
- use Workspace persistence;
- modify WO-0006 / PR #11;
- change DNS/custom domains;
- change Cloud SQL tier/region/storage merely for this feature;
- enable automatic App Hosting rollouts;
- alter accepted Mission migration files `0001` or `0002`;
- weaken dependency-security policy.

## 1. Product model

### Project

A Project is a bounded outcome belonging to exactly one Mission.

Initial public fields:

- stable id;
- Mission id;
- readable slug unique within that Mission;
- creator uid;
- lifecycle status: `active`;
- created timestamp;
- append-only revision containing:
  - **title**
  - **outcome** — what should be true when this Project succeeds

The UI should frame a Project as a thing the Mission needs to make true, not as a department or legal entity.

### Work

Initial Work belongs to exactly one Project.

Initial stable fields:

- stable id;
- Project id;
- readable slug unique within that Project;
- creator uid;
- kind: `task` or `role`;
- lifecycle status: `open`;
- created timestamp;
- append-only revision containing:
  - **title**
  - **description** — what help is needed
  - **done when** — observable completion/success condition

Definitions:

- `task`: bounded thing that needs doing;
- `role`: ongoing/repeating responsibility the Project needs.

Do not add `bounty`, `job`, or `contract` as kinds in this slice.

## 2. New checksum-tracked migration

Add the next Mission migration. Do not edit prior accepted migrations.

Suggested tables:

### `projects`

- `id UUID PRIMARY KEY`
- `mission_id UUID NOT NULL REFERENCES missions(id)`
- `slug TEXT NOT NULL`
- `created_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `status TEXT NOT NULL DEFAULT 'active' CHECK (status = 'active')`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique `(mission_id, slug)`

### `project_revisions`

- `project_id UUID NOT NULL REFERENCES projects(id)`
- `revision INTEGER NOT NULL CHECK (revision > 0)`
- `author_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `title TEXT NOT NULL`
- `outcome TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- primary key `(project_id, revision)`

### `work_items`

- `id UUID PRIMARY KEY`
- `project_id UUID NOT NULL REFERENCES projects(id)`
- `slug TEXT NOT NULL`
- `created_by_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `kind TEXT NOT NULL CHECK (kind IN ('task', 'role'))`
- `status TEXT NOT NULL DEFAULT 'open' CHECK (status = 'open')`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique `(project_id, slug)`

### `work_revisions`

- `work_id UUID NOT NULL REFERENCES work_items(id)`
- `revision INTEGER NOT NULL CHECK (revision > 0)`
- `author_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid)`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL`
- `done_when TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- primary key `(work_id, revision)`

Use explicit length constraints aligned with server validation.

Database triggers must reject UPDATE and DELETE of:

- `project_revisions`
- `work_revisions`

WO-0010 does not implement editing, closing, deleting, or status transitions.

## 3. Creator-only authorization

Until Join exists, the Mission creator is the only writer.

Server-side authorization must prove:

- authenticated Firebase uid exists;
- target Mission exists;
- `missions.creator_uid` equals authenticated uid.

For Work creation, also prove:

- target Project belongs to the target Mission.

Do not authorize from UI visibility or client-supplied creator ids.

Never accept a creator/author uid from request JSON.

### Required negative evidence

Tests must prove:

- signed-out create is rejected;
- authenticated non-creator cannot create a Project;
- authenticated non-creator cannot create Work;
- creator cannot create Work against a Project from another Mission;
- invalid CSRF/origin is rejected.

## 4. Project creation API

Add a protected route under the Mission namespace, for example:

`POST /api/missions/[missionSlug]/projects`

Input:

- title
- outcome
- CSRF token

Requirements:

- verified human session;
- accepted public-origin CSRF rule from WO-0009;
- creator authorization server-side;
- explicit trim/length validation;
- stable readable slug with collision safety;
- Project + revision 1 created atomically;
- response contains only public route/data;
- creator email never returned.

Validation must occur before avoidable persistence work when practical.

Do not expose internal UUIDs unless the implementation clearly needs them.

## 5. Work creation API

Add a protected route under the Project namespace, for example:

`POST /api/missions/[missionSlug]/projects/[projectSlug]/work`

Input:

- kind: `task` or `role`
- title
- description
- doneWhen
- CSRF token

Requirements mirror Project creation:

- verified session;
- valid CSRF/origin;
- creator authorization;
- Project/Mission relationship verified;
- explicit input limits;
- Work + revision 1 atomic;
- readable collision-safe slug;
- no private creator data returned.

## 6. Public Mission page

Replace the current Projects empty rail when real Projects exist.

A Mission page should show:

### Projects & work

For each Project:

- title
- outcome
- number of open Work items, derived from recorded data
- link to Project page

If none exist, preserve:

`No projects or open work yet.`

If the signed-in human is the Mission creator, expose a clear:

`Create a Project`

entry point.

Authorization remains server-side even when the button is hidden from everyone else.

The other Mission rails remain truthful:

- no contributions/MCUs;
- no legal ownership;
- no governance rules.

## 7. Create Project page

Add a route such as:

`/missions/[missionSlug]/projects/new`

Behavior:

- signed out → sign in with return path;
- authenticated non-creator → clear refusal/404 as appropriate;
- creator → minimal form.

Fields:

### Project title
“What are we calling this Project?”

### Outcome
“What should be true when this Project is done?”

Explain briefly:

“A Project is a bounded outcome this Mission needs.”

On success, redirect to the public Project page.

Do not ask for budget, ownership, MCU value, staffing plan, or contract terms.

## 8. Public Project page

Add:

`/missions/[missionSlug]/projects/[projectSlug]`

Anyone may read it.

Show:

- Mission link/name
- Project title
- Active status
- outcome
- created date
- **Open work**

For each Work item:

- Task / Role label
- title
- short description
- link to Work page

If none:

`No open work has been posted yet.`

If viewer is the Mission creator:

`Post needed Work`

Add one concise boundary note on the page:

“Open work is a request for help. It is not yet a job offer, contract, promise of pay, MCU grant, or ownership grant.”

Do not repeat legalistic disclaimers throughout every card.

## 9. Post Work page

Add a creator-only route such as:

`/missions/[missionSlug]/projects/[projectSlug]/work/new`

Fields:

### Type
- Task
- Role

### Title
Plain name for the work.

### What needs doing
Description of the help needed.

### Done when
Observable completion or success condition.

Show the economic/legal boundary once before submission:

“Posting this does not create a contract, compensation, MCUs, or ownership. Join and agreement flows come next.”

After success, redirect to the Work page.

## 10. Public Work page

Add:

`/missions/[missionSlug]/projects/[projectSlug]/work/[workSlug]`

Anyone may read it.

Show:

- Mission
- Project
- Task / Role
- title
- description
- Done when
- Open status
- created date

Primary next-action state:

`Joining this work is not available yet.`

Then:

“Open work is a request for help, not a binding job or contract. No compensation, MCUs, or ownership have been promised by this posting.”

Do not add a fake Apply/Join button.

WO-0011 will own the first real Join/interest action.

## 11. Public/private data boundary

Public Project/Work queries must never select/render:

- creator verified email;
- Firebase uid;
- session data;
- DB credentials;
- internal environment-binding values.

Add tests that serialize the public outputs/pages and prove known creator email/uid values are absent.

## 12. Runtime grants

Update `scripts/mission-runtime-grants.sql`.

Runtime needs:

### `projects`
- SELECT
- INSERT

### `project_revisions`
- SELECT
- INSERT

### `work_items`
- SELECT
- INSERT

### `work_revisions`
- SELECT
- INSERT

Runtime must not receive table-wide UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER rights on these tables and must not own them.

Update the runtime-role checker accordingly.

Add negative PostgreSQL smoke checks proving forbidden Project/Work revision UPDATE/DELETE fails.

Do not broaden existing privileges merely for convenience.

## 13. Backup/restore + CI

Extend Mission PostgreSQL CI evidence to include the new tables.

The functional job must still prove both independent domains:

### Workspace database
Existing migrate/bind/grant/smoke/restore stays green.

### Mission database
- migrate through the new migration;
- bind environment;
- grant runtime role;
- create Project + Work under test Mission data;
- public list/get;
- restricted update/delete refusal;
- logical backup;
- restore;
- compare/verify all Mission/Project/Work/revision/environment/migration records;
- append-only triggers still work after restore.

Dependency-security job remains green.

## 14. Local/product tests

Add dedicated tests covering at minimum:

- Project input limits;
- Work input limits and allowed kinds;
- Project slug collision behavior;
- Work slug collision behavior;
- atomic Project + revision 1 creation;
- atomic Work + revision 1 creation;
- newest/ordered public queries;
- creator Project create succeeds;
- non-creator Project create fails server-side;
- creator Work create succeeds;
- non-creator Work create fails;
- cross-Mission Project/Work mismatch fails;
- invalid CSRF/origin fails;
- public Project/Work views omit creator email/uid;
- revision UPDATE/DELETE rejected;
- boundary copy does not claim contract/pay/MCU/equity exists;
- existing Mission/auth/Workspace/Spark tests remain green.

## 15. Update product/data documentation

Update `docs/DATA_MODEL.md` enough to distinguish the now-live tables from predecessor models.

Do not rewrite the whole document.

Record:

- Mission
- Project
- Work
- their revision tables
- creator-only initial authority
- Join/Contribution/MCU still future.

If useful, add a short operational note to `docs/MISSION_PERSISTENCE.md` saying Project/Work share the dedicated Mission database and runtime boundary.

## 16. Pre-production gate

Before touching production:

- local `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`
- both GitHub Actions jobs green

The deployment candidate must be an exact green commit.

## 17. Production migration

After the branch is green:

Using the existing production migration identity:

1. run only the pending checksum-tracked Mission migration(s);
2. re-run Mission environment binding assertion;
3. reapply/update runtime grants;
4. run the restricted-role checker;
5. run a production-safe check that uses rollback/no-persist behavior;
6. verify `/api/missions/health` remains ready on the currently live app.

Do not create fake persistent Project/Work rows via operator SQL.

If migration/grants fail, stop before application rollout.

## 18. Manual App Hosting rollout

Automatic rollouts stay off.

Manually promote the exact green WO-0010 commit to backend `pct99`.

Record:

- commit;
- build/rollout id;
- status;
- generated URL;
- automatic rollout state.

Retain the previous successful build for application rollback.

No custom-domain work.

## 19. Live read-only smoke

After rollout:

- `/` → 200
- `/api/health` → ready
- `/api/missions/health` → ready
- `/missions` → 200
- existing `WO-0009 test Mission` remains readable
- source link remains present
- Workspace health remains unavailable
- logs contain no unexpected migration/grant/query errors

## 20. Live creator journey

Prefer the existing WO-0009 verified test account + `WO-0009 test Mission` if credentials remain available.

Prove:

1. sign in as that Mission creator;
2. create one clearly labeled `WO-0010 test Project`;
3. create at least one clearly labeled `WO-0010 test task`;
4. Mission page shows the real Project and work count;
5. Project page shows the Work item;
6. Work page shows type/description/done-when;
7. sign out;
8. Mission, Project, and Work remain publicly readable;
9. no creator email/uid appears publicly;
10. no Join/Apply action exists;
11. no compensation/MCU/equity promise appears.

If the prior test account is unavailable, create a new clearly labeled test Mission/account through the real user journey; document why.

Retain the labeled alpha test records rather than manually deleting append-only history.

## 21. Authorization live check

With a second verified test identity if safely available, prove it cannot create a Project inside the first test Mission.

If creating a second real account is impractical, route/integration + PostgreSQL authorization evidence is sufficient for this release; do not weaken server checks merely to make a manual demo easier.

## 22. Operational checks

After the live write:

- Mission DB health still ready;
- runtime role checker still passes;
- environment binding still matches;
- backups/PITR/deletion protection still enabled;
- automatic rollouts still off;
- no migration/admin secret is exposed to serving runtime;
- no DNS/custom-domain/predecessor/Workspace changes occurred.

## 23. Rollback

Application rollback:

- restore the previous successful App Hosting build if the new application behavior fails materially.

Database:

- do not reverse the additive migration after live writes;
- do not delete Project/Work data as application rollback;
- retained additive tables are compatible with the previous app because the previous release does not query them;
- Cloud SQL backups/PITR remain incident-recovery tools, not ordinary deploy rollback.

## 24. Durable report

Create:

`docs/implementation-reports/WO-0010-projects-and-work.md`

Include:

- migration/schema summary;
- authorization model;
- runtime grant changes;
- CI run;
- production migration/grant evidence;
- deployed commit/build;
- live Project/Work journey;
- public privacy checks;
- truthful legal/economic boundary checks;
- Mission DB health;
- backup/PITR/deletion-protection state;
- rollback procedure;
- confirmation no Join/Contribution/MCU/equity/custom-domain/predecessor/Workspace change occurred.

Do not include credentials, cookies, test-account passwords, verification links, private email contents, or secret payloads.

## Acceptance

1. Project is a durable Mission-scoped object with append-only revision 1.
2. Work is a durable Project-scoped `task` or `role` with append-only revision 1.
3. Only the Mission creator can create Projects/Work.
4. Authorization is enforced server-side and negatively tested.
5. Anyone can read Project and Work pages.
6. Creator private identity is absent from public outputs.
7. Mission page shows recorded Projects/Work instead of placeholder state when data exists.
8. UI does not represent open Work as a contract, compensated job, MCU grant, or ownership promise.
9. Runtime DB role receives only required SELECT/INSERT access to new tables.
10. Real PostgreSQL CI + backup/restore covers the new schema.
11. Existing Workspace/Mission/security CI remains green.
12. Production migration/grants complete before rollout.
13. Exact green commit is manually deployed with automatic rollouts off.
14. Live creator Project → Work flow succeeds.
15. Generated-domain public read succeeds signed out.
16. Mission DB health/backups/PITR/deletion protection remain healthy.
17. No Join, Contribution, MCU, equity, custom-domain/DNS, predecessor, or Workspace DB behavior is added/changed.

## Return

Open the PR with all evidence and stop.

Do not start Join.
Do not resume WO-0006.
