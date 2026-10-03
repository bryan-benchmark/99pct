# IMPLEMENTATION REPORT WO-0001

Commit: e12856413780aefd80906f750c1010ff42d35cea

## Follow-up seed

The product owner confirmed `bryan-benchmark/99pct` as the public control plane. A later commit imports `spec/canonical.json` unchanged, records ADR-004, and pushes this repository to GitHub. Claim strings were not edited. Application code was not added. The file list below is the original foundation commit, before that import.

That hash is the foundation commit. The commit that writes this hash into the report only updates `CURRENT_STATE.md` and this file.

## Repository architecture discovered

The Cursor workspace `/Users/bryangaines/Projects/99pct` was an empty directory created 2026-10-03. It was not a git repository and contained no source.

The working Missionism system is elsewhere:

| Piece | Where |
|---|---|
| Website git repo | `/Users/bryangaines/Projects/Missionism/Missionism.com` |
| Remote | `https://github.com/bryan-benchmark/missionism.git` |
| Branch inspected | `feat/mission-workspace-v1` at `321d4b6cf88737c096918cad51069f2294e8c934`, nine commits ahead of `origin/main` (`4747bf3`) |
| Stack | Next.js 16.3.6, React 19.2.8, TypeScript 5, Tailwind 4, Firebase Auth and App Hosting, PostgreSQL via `pg`, PGlite for local workspace tests |
| Protocol claims | `spec/canonical.json` inside the website repo |
| Protocol implementation | `/Users/bryangaines/Projects/Missionism/missionism-protocol`, a sibling directory outside that git repo |

`origin/main` is the explanatory site and two simulators. The feature branch adds Sparks, Pilots, experiments, team-up, toolshare, and Mission Workspace. Production deploy is documented as Firebase App Hosting from `main`. Workspace staging is specified and not ready.

## Files created

All paths are in `/Users/bryangaines/Projects/99pct`:

- `README.md`
- `spec/README.md` (pointer only; no second `canonical.json`)
- `docs/VISION.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- `docs/DATA_MODEL.md`
- `docs/DECISIONS.md`
- `docs/CURRENT_STATE.md`
- `docs/NEXT.md`
- `docs/work-orders/README.md`
- `docs/work-orders/WO-0001.md`
- `docs/implementation-reports/WO-0001-foundation.md`

No files in `Missionism.com` or `missionism-protocol` were changed.

## Current deployment architecture

Public site: Firebase App Hosting, backend `missionism`, project `missionism`, live branch `main`, `apphosting.yaml` with 0–10 instances and 512 MiB. `npm run build` is the Next.js build App Hosting runs.

Workspace, feature branch only: separate staging backend described in `apphosting.staging.yaml`, `DATABASE_URL` from secret `missionismWorkspaceStagingDatabaseUrl`, Firebase session auth, PostgreSQL migrations `0001`–`0007`, restricted runtime role. Runbook status: not configured for production.

This 99pct repository deploys nothing.

## Test and build results

Host: Node v22.23.3, npm 10.9.9, in `Missionism.com` on `feat/mission-workspace-v1`. Default shell Node was v20.20.2; the project engine is `>=22`.

| Command | Result |
|---|---|
| `npm run verify` | Exit 0. `check-canonical-badge: ok`. 81 passed, 0 failed. |
| `npm run lint` | Exit 0. |
| `npx tsc --noEmit` | Exit 0. |
| `npm run build` | Exit 0. Next.js 16.3.6 compiled and generated 24 pages. |
| `npx tsx --test src/talent/invariants.test.ts` | Exit 0. 2 passed, 25 todo, 0 failed. Not wired into `verify`. |

Verify counts: mission units 33, voice 4, sparks 2, pilots 2, toolshare 2, team-ups 2, experiments 2, workspace 34.

Not run: `.github/workflows/workspace-checks.yml` (PostgreSQL service, migrate, restricted-role smoke, restore). Not run: `npm audit`.

No tests were deleted or weakened.

## Known risks

- Two trees. Agents opened in 99pct do not see the application. Agents opened in Missionism.com do not see these docs. ADR-004 records that as a proposal.
- `MCU_PROTOCOL.md` says an MCU is not a share certificate and also that an MCU is a mission-local ownership claim. ADR-001 accepts the work order's separation. ADR-005 proposes a later wording reconciliation and forbids doing it silently.
- `missionism-protocol` is outside the website repository. Its README still defines MCU as dual accounting and pie claim, and it includes an optional EVM notarization sketch marked as not the preferred witness.
- Feature-branch prototypes persist under `.data/` on local disk. They will not survive a normal App Hosting instance the way PostgreSQL would, and they are not on `main`.
- Untracked local files in the website repo were not part of commit `321d4b6`.
- Live production was not fetched. Deploy docs and `origin/main` were treated as the production description.
- Ownership safety invariants are documentation. Nothing in code enforces passkeys, external stock ledgers, or SSN rejection yet.

## Contradictory or obsolete systems

- Explanatory homepage versus the requested product homepage. The current primary call to action explains Missionism. It does not start a Mission.
- Spark / Pilot / Mine / Mission Cell / Mission Unit / Workspace organization are overlapping names for "a thing people start." `PRODUCT.md` names the six target objects and does not rename code.
- Mission Units simulator versus a future append-only MCU ledger. Related ideas, different systems.
- Workspace audit log versus MCU ledger versus legal stock ledger. The workspace log is the closest existing append-only history and it records organization decisions, not contributions or shares.
- Dual MCU wording versus ADR-001. See ADR-005.
- `missionism-protocol` "one global immutable ledger" versus per-Mission contribution constitutions in the work order. Not resolved here.

Worth retaining: canonical.json single source, append-only workspace history, server-side workspace authorization, restricted database role, Mission Units reversal-and-policy-version pattern, OpenTimestamps-style root notarization as a witness rather than a bearer asset, and the explicit note in `MCU_PROTOCOL.md` that MCU mapping to legal equity is a separate layer.

## Decisions intentionally not made

- Did not choose ADR-004's repository. Did not copy or import the application.
- Did not edit canonical claims or spec prose.
- Did not pick a corporate form, share count, equity plan, Rule 701 posture, or crowdfunding rail.
- Did not define a Contribution Constitution formula.
- Did not map Sparks onto Missions in code.
- Did not decide citizenship, tax, or industry rule engines beyond documenting progressive verification as product direction.
- Did not add passkeys, Merkle jobs, or provider integrations.
- Did not deploy.

## Recommended next work order

WO-0002: accept or replace ADR-004, then put the handoff docs and the application in one repository. Do not build the Mission loop in the same order.

The following slices, after that, are in `docs/NEXT.md`: start or discover a Mission, add Projects and Work, join, record a contribution, show MCU history with equity marked not yet issued.

## Canonical docs updated

Created the handoff set listed above. `CURRENT_STATE.md` describes this pass. No predecessor canonical file was modified.
