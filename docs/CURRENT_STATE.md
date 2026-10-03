# Current State

Updated: 2026-10-03  
Commit: pending first commit of this repository  
Predecessor inspected: `bryan-benchmark/missionism` `feat/mission-workspace-v1` `321d4b6cf88737c096918cad51069f2294e8c934`  
Production branch tip: `origin/main` `4747bf3` Make Mishys Launch compile from founder intentions

This repository contains handoff documents only. It has no application, no tests, and no deployment. The sections below describe that fact first, then the predecessor that actually runs.

## Production / Deployable

This repository: nothing to deploy.

Predecessor production path, from `docs/DEPLOY.md` and `origin/main`:

- Next.js 16 App Router site (`missionism-com` 0.1.0, React 19, Node 22).
- Firebase App Hosting backend id `missionism`, project `missionism`, automatic rollouts from `main`.
- Config: `apphosting.yaml`, `firebase.json`, `.firebaserc`.
- Routes on `origin/main`: `/`, `/principles`, `/how-it-works`, `/why-now`, `/specification`, `/open-questions`, `/changes`, `/simulators/mishys-launch`, `/simulators/mission-units`.

WO-0001 did not open the live domain and did not confirm which commit is currently rolled out. The deploy document says `main` rolls out automatically.

The feature branch is nine commits ahead of `origin/main` and is not the documented production branch.

## Working

In this repository: the documents listed in `README.md`.

On `origin/main`, working as a static and server-rendered explanatory site plus simulators. Homepage hero is "Own your work. / Own your life." Primary action is "See how it works" (`/how-it-works`). Secondary action links to `https://mishys.com`. Canonical claims render only from `spec/canonical.json`.

On `feat/mission-workspace-v1`, also present and covered by tests:

- Spark proposals and interest stored as local JSON.
- Pilot plans, experiment proposals, team-up, and toolshare demos.
- Mission Workspace: create organization, submit contract revisions, invite a reviewer, submit decisions, review, audit, export. Firebase session cookie. PostgreSQL with append-only history triggers. Server-side membership checks.

The workspace runbook says the local workflow works with the Firebase Auth emulator and PostgreSQL or PGlite. No managed staging or production workspace is configured.

## Partially implemented

- Mission creation, in prototype form, as Sparks on the feature branch. A Spark is a wish plus a few fields, not a Mission with projects, work, MCU rules, or a public contributor graph.
- Join, in prototype form, as Spark interest and workspace invitations. Interest is anonymous-browser file state. Workspace membership is a private organization role, not public Mission membership.
- Contribution accounting, as the experimental Mission Units engine and simulator. It models events, reversals, and policy versions. It does not persist a production MCU ledger and it is not wired to Sparks or the workspace.
- Governance, as workspace decisions and independent reviews. That is an audited decision memo flow. It is not Mission proposals and voting.
- Cryptographic witnessing, as a design and a sibling `missionism-protocol` package that hashes ledger roots. It is not running inside the website.

## Not implemented

In both this repository and the predecessor application:

- The six-object product loop as specified in `PRODUCT.md` (Mission, Project, Work, Post, Proposal, Contribution) as first-class public objects.
- Production MCU ledger and Contribution Constitutions.
- Passkeys.
- Progressive verification providers, tax-document status flags, or a ban on raw SSN storage as an enforced application boundary. Workspace stores Firebase uid and email only. No SSN field was found. That absence is not the provider integration.
- Equity settlement, stock-ledger references, cap table, payroll, distributions, repurchase, financing, or secondary trading.
- Public profiles as a contribution graph.
- A homepage prompt of "What should exist?"

## Known issues

- This 99pct workspace was empty at inspection. The application is a different directory. ADR-004 is unresolved.
- `feat/mission-workspace-v1` has uncommitted local files that are not in `321d4b6`: untracked `src/workspace/db/runtime-role.ts` (not imported; the committed checker is `scripts/workspace-check-runtime-role.ts`) and untracked `docs/reviews/`.
- `src/talent/invariants.test.ts` is outside `npm run verify`. It passed with 2 assertions and 25 todo tests. Those todos are intentional Phase 0 placeholders, not product behavior.
- Spec wording conflicts with ADR-001. See ADR-005. Left unchanged.
- `missionism-protocol` is a sibling directory outside the website git repository.
- Workspace production blockers in `docs/WORKSPACE_OPERATIONS.md` remain: managed staging database, backups, point-in-time recovery, monitoring, and live Firebase configuration are unverified.
- Homepage and README still describe an explanatory site. `README.md` site map does not list Sparks, demos, or workspace routes that exist only on the feature branch.

## Current data model

This repository: none.

Predecessor: see `DATA_MODEL.md`. Summary: no public Mission tables on `main`. Feature branch adds local JSON prototypes and the workspace PostgreSQL schema (`workspace_users`, `organizations`, `memberships`, append-only contract and decision history, audit events, invitations, rate limits, environment binding).

## Current architectural boundaries

Accepted for future 99pct work: ADR-001 and ADR-002. Not implemented in code.

Predecessor boundaries that already exist and should be kept:

- Canonical claim text has one source, `spec/canonical.json`.
- The public site build does not require workspace secrets. Workspace routes fail closed without server configuration.
- Workspace history is append-only at the database.
- Runtime database role is distinct from the migration role.
- Mission Units engine has no manual ownership-percentage setter.
- The website is documented as an explanatory interface. The spec directory is authoritative for the protocol.

No securities issuance or transfer happens in the application today. Do not describe the simulators as if it does.

## Test state

Ran on 2026-10-03 in `Missionism.com` with Node v22.23.3 (`.nvmrc` is 22). Working tree included the two untracked paths above; they are not imported by the scripts that ran.

| Command | Result |
|---|---|
| `npm run verify` | Exit 0. Canonical badge check ok. 81 tests passed, 0 failed. |
| `npm run lint` | Exit 0. |
| `npx tsc --noEmit` | Exit 0. |
| `npm run build` | Exit 0. Next.js 16.3.6. 24 static pages generated. Feature-branch routes included because the build ran on `feat/mission-workspace-v1`. |
| `npx tsx --test src/talent/invariants.test.ts` | Exit 0. 2 passed, 25 todo, 0 failed. Not part of `verify`. |

`npm run verify` breakdown: mission units 33, voice 4, sparks 2, pilots 2, toolshare 2, team-ups 2, experiments 2, workspace 34.

Not run: the GitHub Actions job `.github/workflows/workspace-checks.yml` (disposable PostgreSQL 18, restricted role, migrate, bind, pg-smoke, audit check, logical restore). Local `verify` does not replace that job. `npm audit` was not run.

## Deployment state

Documented production: Firebase App Hosting from `main`, public protocol site, minimum instances 0, maximum 10, 512 MiB.

Staging workspace file `apphosting.staging.yaml` sets `WORKSPACE_RELEASE_TARGET=staging` and references secret `missionismWorkspaceStagingDatabaseUrl`. The runbook says that backend is not ready.

This 99pct repository has no hosting configuration.
