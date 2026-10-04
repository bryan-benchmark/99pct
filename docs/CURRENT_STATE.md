# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Source provenance: private predecessor tracked tree `321d4b6`, imported without private Git history
- No 99pct deployment has been cut over to `99pct.com`
- Existing predecessor Firebase/domain/database production remains untouched
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Application baseline

The repository contains the preserved Next.js/Firebase/PostgreSQL baseline:

- Next.js 16 / React 19 / Node 22
- Firebase Auth and App Hosting configuration inherited from the predecessor
- PostgreSQL Mission Workspace
- append-only workspace history and server-side authorization
- migrations 0001–0007
- experimental Sparks/Pilots/Teamups/Toolshare/Mission Units code
- explanatory Missionism site and simulators

These imported systems are baseline/prototype code. They are not automatically the final 99pct product model.

## Verification at WO-0004

GitHub Actions run `37210557154` passed both independent jobs.

Functional CI passed:

- install
- 81 tests
- lint
- Next type generation
- TypeScript
- staging-marked build
- disposable PostgreSQL migration
- environment binding
- restricted runtime-role checks
- customer smoke
- audit-integrity check
- logical backup/restore
- restored-record verification

Dependency-security CI passed the repository audit policy.

## Dependency-security state

Safe brace-expansion findings were patched.

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, installed only through the unused Firebase client Firestore path; a source guard fails if Firestore becomes used.
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only through the lint toolchain and currently unpatched upstream.

The audit checker rejects a new moderate-or-higher advisory, an expired exception, a changed accepted path/version, or another install of an excepted package that falls inside that advisory's affected range.

These exceptions are not permission to weaken security policy and must be reviewed before expiry.

## Deployment boundary

The imported configuration still points at the predecessor Missionism Firebase project/backend.

ADR-011 requires the first 99pct deployment to use separate 99pct-controlled Firebase infrastructure, Firebase's generated App Hosting URL, and manual rollouts. The predecessor deployment and `99pct.com` must not be changed during the baseline deployment.

The public application must expose a clear AGPL source-code link before any network rollout.

## Product not yet implemented here

The first intended 99pct loop remains:

Mission → Project → Work → Join → Contribution → MCU history.

Also not implemented: public contribution profiles, production MCU ledger, passkeys, progressive verification providers, legal equity settlement, payments, repurchase, financing, or secondary liquidity.

## Active next step

Execute `docs/work-orders/WO-0005-deployment-baseline.md`.

No custom-domain cutover or predecessor-infrastructure modification is authorized by WO-0005.
