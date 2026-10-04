# WO-0007 — Mission foundation: Start + Discover

## Goal

Build the first real 99pct product vertical slice in the repository:

`verified human → Start a Mission → Mission saved → discover Missions → open public Mission page`

This replaces prototype-only creation with a real target-domain implementation, while leaving production infrastructure unchanged.

A Mission created in this order is **forming**. It creates no legal entity, MCU grant, share issuance, contract, payment obligation, or protocol certification.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- ADR-013 in `docs/DECISIONS.md`
- `docs/SECURITY_INVARIANTS.md`
- existing Spark implementation under `src/sparks/` and `src/app/simulators/mission-spark/`
- existing Firebase session implementation under `src/workspace/auth/`

Reuse useful interaction/security patterns. Do not make Spark files or Workspace organizations the Mission source of truth.

## Branch

`wo/0007-mission-foundation`

## Hard boundaries

Do not:

- provision a paid/managed production database;
- deploy this product slice to App Hosting;
- modify WO-0006 / PR #11 DNS state;
- enable Firestore;
- weaken the current no-Firestore security guard;
- reuse `organizations` as Missions;
- rename Sparks into Missions;
- issue MCUs, equity, contracts, payments, or ownership percentages;
- implement Projects/Work/Join in this order;
- edit canonical protocol claims;
- add an administrator ownership override;
- add raw government identifiers or financial balances.

The live generated `hosted.app` deployment stays on the previously accepted release.

## 1. Introduce a site-wide verified human session

The existing Workspace Firebase auth is private-workspace specific. Create a site-wide human-account/session surface without breaking Workspace auth.

Required user flow:

- `/sign-in`
- create account with email/password;
- Firebase sends email verification;
- unverified email cannot establish a 99pct human session;
- verified user can sign in;
- server exchanges a fresh verified Firebase ID token for an HttpOnly session cookie;
- sign out clears/revokes the session.

Requirements:

- use the existing Firebase project architecture;
- session cookie must be HttpOnly, Secure in production, SameSite strict or equivalently restrictive;
- same-origin + CSRF protection on session mutation;
- require recent authentication before creating the session;
- server-side session verification;
- generic auth modules should not require the private Workspace database merely to authenticate a human;
- do not delete or silently repurpose the existing Workspace session cookie/API.

Use a distinct cookie/name for the public human session.

### Negative tests

At minimum prove:

- unverified identity cannot create a session;
- malformed/invalid session is treated as signed out;
- cross-origin/invalid-CSRF session mutation is rejected.

## 2. Add the real Mission PostgreSQL model

Create a new Mission domain under a clear location such as `src/missions/`.

Do not write to `.data/sparks`.

Use PostgreSQL-compatible migrations and PGlite for local/integration tests.

Minimum schema:

### `human_accounts`

Private application identity link:

- Firebase UID primary key
- verified email
- created timestamp

No raw SSN, government identifier, cash balance, share count, or public-profile requirement yet.

### `missions`

Stable identity:

- UUID id
- stable unique slug
- creator Firebase UID
- lifecycle status: initially `forming`
- created timestamp

Do not put editable purpose/name text only on this row.

### `mission_revisions`

Append-only public description:

- Mission id
- positive integer revision
- author Firebase UID
- name
- purpose / what should exist
- beneficiaries / who this is for
- starting place
- created timestamp

Revision 1 is written atomically with Mission creation.

Updates/deletes to mission revisions must be rejected by the database. Later Mission changes can create a new revision through governance; WO-0007 does not implement editing.

### Environment binding

Follow the useful fail-closed pattern from Workspace:

- separate Mission database env names;
- production mode must not silently connect to an arbitrary database;
- support a local PGlite test/dev path;
- production connection/binding is not configured in this work order.

Avoid a large generic database-framework rewrite. Small shared utilities are fine only if they make both domains clearer and do not weaken Workspace tests.

## 3. Mission creation contract

Minimum input:

- **Name** — what people call it
- **Purpose** — what should exist / what this Mission exists to make true
- **For** — who benefits
- **Starts in** — place/community/context; may be `Global` or `Remote`

Keep this intentionally smaller than the Spark pilot form. Project/pilot/work detail comes later.

Server rules:

- verified human session required;
- same-origin + CSRF required for mutation;
- trim/validate all strings with explicit length limits;
- generate a stable readable slug with collision safety;
- atomically upsert/link the human account and create Mission + revision 1;
- creator identity/email is not exposed publicly by default;
- response redirects/returns the new public Mission URL.

### Negative tests

Prove:

- unsigned user receives server-side refusal;
- cross-origin or invalid-CSRF create is refused;
- invalid/oversized fields are refused;
- a failed revision insert cannot leave a half-created Mission;
- slug collisions cannot overwrite another Mission.

## 4. Public discovery

Add:

`/missions`

Anyone can open it without authentication.

Show real stored Missions in newest-first order.

Each result should make it easy to scan:

- name
- forming status
- purpose
- who it is for
- starting place

Empty state should be useful, not look broken.

Do not mix Spark proposals into this list.

## 5. Start a Mission

Add:

`/missions/new`

Behavior:

- signed-out visitor is directed to sign in, preserving return path;
- verified signed-in human gets the four-field start form;
- explain once, briefly, that this creates a public **forming Mission**, not a company, contract, ownership grant, or fundraiser;
- after successful create, go to the Mission page.

Use the useful simplicity of the Spark prototype, but do not copy its pilot/evidence/input fields into the Mission object.

## 6. Public Mission page

Add:

`/missions/[slug]`

Anyone can read it.

The first real page should answer only facts we actually have:

- Mission name
- **Forming** status
- purpose
- who it is for
- where it starts
- created date

Then show explicit empty-state rails for the product that comes next:

### Projects & work
“No projects or open work yet.”  
Do not invent items.

### Contribution
“No contributions or MCUs have been recorded yet.”

### Ownership
“No legal ownership has been issued or linked.”

### Governance
“No governance rules have been published yet.”

Do not show a fake percentage, estimated equity, revenue, member count, MCU balance, or “certified” badge.

## 7. Product entry surface

Move the homepage/navigation toward the actual 99pct product without deleting the deeper Missionism material.

Homepage primary actions:

- **Explore Missions** → `/missions`
- **Start a Mission** → `/missions/new`

The opening copy should explain the product in plain language: people can start something that should exist, build it together, record contribution, and later connect that contribution to real ownership through the appropriate legal process.

Do not claim the currently implemented slice already issues ownership.

Nav should make Missions / Start discoverable. Existing Principles / How It Works / specification material can remain available.

Do not perform a giant visual redesign in this order. Product hierarchy matters more than styling.

## 8. Preserve predecessor prototypes

Spark/Pilot/Workspace routes remain available and their tests remain green.

Do not silently migrate existing Spark data into Missions.

If future migration seems useful, record it as follow-up only.

## 9. Verification

Add a dedicated Mission test command and include it in `npm run verify`.

Minimum automated evidence:

- input parsing/limits;
- slug generation/collision behavior;
- Mission + revision-1 atomic persistence;
- immutable revision enforcement;
- list/get behavior;
- authorized creation succeeds;
- unauthorized creation fails server-side;
- CSRF/origin refusal;
- public Mission response/page never exposes creator email;
- copy/assertions for no-MCUs/no-legal-ownership forming state;
- existing Workspace/Spark tests remain green.

Run:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

Both GitHub Actions jobs must remain green.

## 10. No production rollout

Do **not** provision the managed Mission database or manually promote this code to App Hosting.

At the end of this order the code is ready for a dedicated persistence/deployment work order.

The existing live generated URL should continue serving the prior accepted deployment.

## PR evidence

The PR is the default implementation report.

Include:

- schema/migration summary;
- auth/session boundary;
- screenshots or concise browser evidence for home → missions → start → Mission page using local/dev data;
- test counts;
- all local gate results;
- GitHub Actions run;
- explicit confirmation that no production DB, App Hosting rollout, DNS, MCU/equity, or Workspace schema was changed.

No standalone implementation report is required unless migration/security evidence grows beyond the PR.

## Acceptance

1. Public human auth/session exists independently of Workspace session storage.
2. Mission domain is separate from Spark and Workspace.
3. Mission descriptions are append-only revisions.
4. Verified human can create a forming Mission in local/integration environment.
5. Unauthorized creation is rejected server-side.
6. Anyone can discover Missions.
7. Anyone can open a public Mission page.
8. No private creator email is exposed publicly.
9. UI truthfully states no MCU/legal ownership/governance data exists yet.
10. Homepage/nav expose Explore Missions and Start a Mission.
11. Spark/Workspace behavior remains intact.
12. Full local and GitHub CI/security gates pass.
13. No production database, deployment, DNS, or economic/legal issuance change occurs.

## Return

Open the PR and stop.

Do not start Projects/Work.
Do not provision production persistence.
Do not deploy.
