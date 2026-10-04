# WO-0013 — 99pct product-shell reset

## Goal

Correct the public product identity before building Contribution or MCU rails.

99pct is not a renamed Missionism website.

The live application must become unmistakably **99pct**: an open-source human-commerce network where people will eventually be able to **Use**, **Operate**, and **Build** shared utilities for the 99%, by the 99%.

This order does not build a utility vertical. It establishes the correct product doors so later Utility Missions fit naturally.

Missionism remains the underlying protocol / operating philosophy used by 99pct.

This order changes product shell, information architecture, discovery, and copy. It does **not** change the Mission database schema or economic ledgers.

After green CI, manually deploy the exact reviewed commit to the existing 99pct App Hosting backend.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/PRODUCT.md`
- ADR-018 and ADR-019 in `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- current root page, layout metadata, nav, footer
- current Mission / Project / Work public pages
- current Missionism Principles / How It Works / Specification / Open Questions / Changes pages
- WO-0012 implementation report

## Branch

`wo/0013-99pct-product-shell`

## Hard boundaries

Do not:

- change Mission/Project/Work/interest/invitation/confirmation schema;
- add a migration;
- alter production rows;
- implement Contribution;
- issue or calculate MCUs;
- issue or estimate legal ownership;
- add payments, funding, contracts, governance, or trading;
- rename Missionism canonical claims into 99pct claims;
- rewrite `spec/canonical.json` merely for branding;
- delete Missionism protocol pages;
- delete predecessor experiments just because they leave the primary chrome;
- change Cloud SQL configuration;
- change Firebase Auth behavior;
- change DNS/custom domains or WO-0006 / PR #11;
- touch the predecessor Missionism Firebase backend;
- enable automatic App Hosting rollouts;
- weaken dependency-security policy.

This is a product-shell correction, not a protocol rewrite.

## 1. Brand hierarchy

Global application brand:

**99pct**

Missionism is not the global brand.

Remove Missionism visual identity from global product chrome:

- no Missionism icon in the main nav;
- no Missionism wordmark in the main nav;
- no default metadata title `Missionism`;
- no Missionism favicon/icon reference in root metadata;
- no footer that describes the entire application as Missionism.

Do not invent a permanent elaborate logo in this order.

Use a simple typographic mark in the header:

**99%**

with an accessible name such as `99pct home`.

The domain/product name may be written `99pct` in prose.

## 2. Root metadata

Update root metadata:

- default title: `99pct`
- title template: `%s · 99pct`
- description should describe the 99pct product, not the Missionism protocol.

Suggested description:

> Open-source infrastructure for people to start Missions, find Work, and build what should exist together.

Remove the Missionism icon from global metadata.

If no approved 99pct favicon exists, it is acceptable to ship without a custom favicon rather than pretending a Missionism asset is 99pct branding.

## 3. New 99pct homepage

Replace the current Missionism declaration homepage.

The root page must not use the Missionism H1, Missionism wordmark, `DocStatus`, or canonical protocol document status as its main framing.

### Hero

Use this hierarchy or extremely close wording:

Eyebrow:

**FOR THE 99%, BY THE 99%**

H1:

**Build what should exist.**

Lede:

> 99pct is an open-source place to start a Mission, find people, break it into Projects and Work, and build it together.

Supporting truth:

> The long-term goal is to make contribution visible and auditable, then let Missions recognize it with MCUs and connect it to real ownership only where the legal machinery actually exists.

Do not say MCUs or ownership are already live.

Primary actions:

- **Use 99pct** → `/use`
- **Build 99pct** → `/work`
- **Start a Mission** → `/missions/new`

Keep **Explore Missions** as a visible secondary path to `/missions`.

### Three-mode explanation

Explain the network simply:

- **Use** — choose 99pct utilities for ordinary life.
- **Operate** — provide the actual service inside a Utility Mission.
- **Build** — build and maintain Missions/infrastructure through Projects and Work.

State truthfully that no consumer Utility Mission is live yet and operator surfaces arrive with the first real utility vertical.

Add one compact “How 99pct grows” sequence.

Show implementation state honestly.

#### Live now

- Start a Mission
- Create Projects
- Post needed Work
- Express interest
- Mutually confirm helping

#### Being built next

- Record Contribution
- Review / recognize Contribution
- Issue MCUs under transparent Mission rules
- Connect recognized contribution to legal ownership only where implemented

Do not show fake balances, percentages, users, revenue, MCU totals, or ownership numbers.

### Human-first/open-source framing

Explain the product direction in plain language, not ideology-heavy copy.

Include the essential ideas:

- people should be able to build together without asking a conglomerate for permission;
- useful infrastructure should be open and forkable;
- people doing the building should have a path for contribution to matter;
- systems should reduce friction rather than blame humans for process failures;
- 99pct is designed around win-win-win outcomes among humans, Missions, and the communities they serve.

Keep this concise.

### Missionism relationship

Include a small supporting section near the bottom:

**Powered by Missionism**

Copy should make the relationship explicit:

> Missionism is the open protocol underneath 99pct: a way to organize work around a shared mission, human agency, contribution, and progressive ownership. You do not need to understand the protocol before using 99pct.

Link:

**Read the Missionism protocol** → `/missionism`

Missionism is supporting material, not the homepage identity.

### Open source

Include a visible link to the public source repository.

Keep AGPL source visibility required by ADR-007.

## 4. Primary navigation

Replace the current protocol-heavy global navigation.

Primary nav:

- **Use** → `/use`
- **Build** → `/work`
- **Missions** → `/missions`
- **Start** → `/missions/new`
- **Missionism** → `/missionism`

Brand anchor:

- typographic `99%`
- links to `/`
- accessible name identifies 99pct.

Do not include Principles, Why Now, Specification, Open Questions, Mishys, demos, or simulators in the primary nav.

Those resources remain reachable through the Missionism hub/footer as appropriate.

## 5. Add an honest Use 99pct surface

Add:

`/use`

This is the customer-side entry point for the future Utility Mission network.

WO-0013 must **not** invent live services.

H1:

**Use 99pct**

Lede:

> A place to find everyday services built for the 99%, by the 99%.

Explain with a compact set of clearly labeled future examples:

- Rideshare 99
- Stay 99
- Music 99

They are examples / future Utility Missions, not clickable fake live marketplaces.

Primary empty-state truth:

> No 99pct utilities are live yet. We are building the shared infrastructure first.

Then provide useful actions:

- **Build the infrastructure** → `/work`
- **Start a Mission** → `/missions/new`
- **Explore Missions** → `/missions`

Add one sentence explaining that future customer services can use different interfaces while sharing the same 99pct substrate.

Do not add fake ratings, inventory, prices, drivers, hosts, artists, bookings, or transaction counts.

## 6. Add a real Find Work / Build surface

Add:

`/work`

This is a public 99pct product surface, not a prototype.

Anyone can browse it signed out.

### Query

Add a privacy-safe query for open Work across Missions.

Each public result may include:

- Mission name + slug
- Project title + slug
- Work title + slug
- kind: Task / Role
- short description
- done-when
- created date
- aggregate interest count
- aggregate helping count

Sort newest open Work first.

Reasonable initial limit is acceptable, e.g. 100.

Do not include:

- Firebase uid
- creator uid
- verified email
- private interest note
- interest id
- invitation id
- confirmation row/id
- session/auth data

### Page

H1:

**Find Work**

Lede:

> Find something worth helping with.

For each item make the Mission and Project context obvious.

Link directly to the existing public Work page.

Use the existing boundary truth:

Open Work is a request for help. It is not automatically a paid job, contract, MCU grant, or ownership grant.

Empty state:

> No open Work has been posted yet.

CTA:

**Start a Mission** if there is nothing to join.

Do not build search/filter infrastructure unless trivial. A clean first browse list is enough.

## 7. Add a Missionism protocol hub

Add:

`/missionism`

Purpose: preserve and clarify the protocol layer.

H1:

**Missionism**

Use the exact locked public definition from `src/content/voice.ts`.

Then state plainly:

> 99pct uses Missionism as its organizational protocol. 99pct is the product; Missionism is the system underneath it.

The page should link to:

- Principles
- How It Works
- Why Now
- Specification
- Open Questions
- Changes

It may show the protocol version/status and `DocStatus`.

This is the appropriate place for canonical/protocol maturity framing.

Do not duplicate the entire specification into this page.

## 8. Preserve protocol routes

Existing routes remain available:

- `/principles`
- `/how-it-works`
- `/why-now`
- `/specification`
- `/open-questions`
- `/changes`

They may continue using Missionism language because they are Missionism protocol material.

Do not convert their canonical claims into 99pct marketing claims.

Metadata template may naturally become `· 99pct` because they live inside the 99pct application.

## 9. Remove predecessor experiments from primary chrome

The following may remain reachable but must not be promoted in the main nav/footer:

- Spark prototype
- MU simulator
- Mishys Launch
- Toolshare demo
- Team-Up demo
- Experiment demo
- other imported predecessor/demo surfaces

Do not delete them in WO-0013.

They remain research/history until a later cleanup order decides their fate.

## 10. Footer

Replace the Missionism-heavy footer.

Suggested compact structure:

> 99pct · For the 99%, by the 99%.

Links:

- Missionism
- Principles
- Specification
- Open Questions
- Source (AGPL-3.0)

Optional small truth line:

> 99pct is open-source infrastructure for building Missions together.

Do not put the full Missionism protocol status, simulator catalog, Mishys links, or predecessor demos in the global footer.

The source link must remain.

## 11. Missions surface alignment

Keep existing Mission creation/data semantics unchanged.

Lightly align public product copy where needed so a cold visitor understands:

- a Mission is something people are trying to make real;
- “forming” is a product state;
- starting a Mission does not automatically create a company, fundraiser, ownership, or legal entity.

Do not rewrite the Mission schema or authorization.

No large redesign is required.

## 12. Work page alignment

Keep all accepted WO-0010 through WO-0012 behavior.

The public Work page must continue to support:

- interest count;
- helping count;
- `I want to help`;
- creator invitation;
- helper confirmation;
- privacy boundaries.

Do not regress those flows while changing the shell.

The global 99pct chrome should make these pages feel like part of the 99pct product rather than embedded inside a Missionism brochure.

## 13. Content/source organization

Prefer a new product content module such as:

`src/content/99pct.ts`

for 99pct homepage/product-shell copy.

Keep:

- `src/content/voice.ts` for locked Missionism definitions;
- canonical claims in the protocol/canonical layer.

Do not overload Missionism voice files with 99pct marketing/product copy.

## 14. Product documentation

`docs/PRODUCT.md` and ADR-018 already establish the corrected relationship.

Implementation must conform to them.

If implementation discovers a conflict, stop and raise it rather than silently reverting to “99pct is the product surface for Missionism.”

## 15. Regression tests — brand separation

Add focused tests that fail if the old drift returns.

At minimum prove:

- root page identifies 99pct and does not render `<h1>Missionism</h1>`;
- root page exposes Use 99pct / Build 99pct / Start a Mission and a path to Explore Missions;
- `/use` truthfully says no Utility Mission is live yet and does not render fake transactional data;
- root page links Missionism as supporting protocol;
- global nav does not reference `missionism_icon_vector.svg` or `missionism_wordmark_vector.svg`;
- root metadata default brand is 99pct;
- global metadata does not use the Missionism icon;
- footer keeps Source (AGPL-3.0);
- footer does not list predecessor simulators/demos;
- `/missionism` uses the locked Missionism definition and links protocol resources.

## 16. Find Work privacy tests

Test the new public Work discovery query/page with known private values.

Prove serialized public output does not contain:

- creator/helper emails;
- Firebase uids;
- private notes;
- interest ids;
- invitation ids.

Prove:

- only open Work is returned;
- Mission/Project context is correct;
- Task/Role kind is correct;
- interest/helping counts are accurate;
- ordering is deterministic/newest-first.

No new DB grants should be needed beyond the existing SELECT permissions.

If a grant change appears necessary, explain why before broadening anything.

## 17. Full regression

Run:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

Both required GitHub Actions jobs must be green.

Existing Mission/Auth/Project/Work/interest/participation tests remain green.

## 18. Production rules

WO-0013 has **no database migration**.

Before rollout:

- verify `/api/missions/health` is ready;
- verify current build-014 is healthy;
- verify no schema/migration files changed or were added;
- verify no production rows need mutation.

No migration/grant step is needed.

## 19. Manual App Hosting rollout

Automatic rollouts remain off.

Manually promote the exact green WO-0013 commit to backend `pct99`.

Record:

- commit SHA
- build id
- state
- generated URL
- automatic rollout state

Retain build-014 as rollback target.

No custom-domain cutover.

## 20. Live smoke

On the generated App Hosting URL verify:

- `/` → 200, clearly 99pct
- root does not present Missionism as the product brand
- `/use` → 200 with truthful no-utilities-live state
- `/missions` → 200
- `/work` → 200 and displays the existing WO-0010 test task
- `/missionism` → 200 and clearly identifies Missionism as protocol
- Principles / How It Works / Specification remain reachable
- existing WO-0009 Mission → WO-0010 Project → Work page remains reachable
- signed-out Work page still shows safe aggregate interest/helping counts
- `/api/health` ready
- `/api/missions/health` ready
- Workspace health remains unavailable
- source link visible
- no private email/note appears in public shell/discovery

## 21. Rollback

Application rollback may return to build-014.

There is no schema change in WO-0013, so rollback is application-only.

Do not alter the existing production Mission data merely to validate branding.

## 22. Durable report

Create:

`docs/implementation-reports/WO-0013-99pct-product-shell.md`

Include:

- before/after product identity summary;
- homepage/nav/footer/metadata changes;
- Missionism hub;
- Find Work query/privacy behavior;
- CI runs;
- deployed commit/build;
- live route smoke;
- confirmation existing Mission → Project → Work → helping flow remains intact;
- confirmation no DB migration/rows/grants, Auth, DNS, custom domain, predecessor backend, Contribution, MCU, equity, or payment behavior changed.

## Acceptance

1. Root application is branded 99pct, not Missionism.
2. Homepage explains 99pct as a shared human-commerce network with Use / Operate / Build modes.
3. Homepage primary actions are Use 99pct, Build 99pct, Start a Mission, with Explore Missions still easy to reach.
4. `/use` exists and truthfully states that no consumer Utility Mission is live yet.
5. Homepage truthfully separates current Build primitives from future consumer utilities, Contribution, MCU, money, and ownership rails.
6. Global nav uses 99pct identity and no Missionism logo assets.
7. Global metadata defaults to 99pct and no Missionism favicon.
8. Public `/work` discovery exists and contains no private data.
9. `/missionism` clearly presents Missionism as the protocol underneath 99pct.
10. Existing Missionism protocol routes remain available.
11. Predecessor demos/simulators leave primary nav/footer without being deleted.
12. AGPL source link remains visible.
13. Existing Mission → Project → Work → Interest → Invitation → Confirmation behavior remains green.
14. No database schema, production rows, DB grants, Auth, DNS, Contribution, bounty rewards, MCU, ownership, or payment behavior changes.
15. Exact green commit is manually deployed with automatic rollouts off.
16. Live generated-host smoke proves the new product shell.

## Return

Open the PR with all evidence and stop.

Do not start Contribution.
Do not implement MCUs.
Do not resume WO-0006.
