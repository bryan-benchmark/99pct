# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Live deployment baseline

99pct now has dedicated infrastructure separate from the predecessor:

- Firebase project: `pct-99`
- App Hosting backend: `pct99`
- region: `us-central1`
- generated URL: `https://pct99--pct-99.us-central1.hosted.app`
- automatic rollouts: off
- custom domain: none yet
- workspace database: none

WO-0005 proved manual exact-commit rollout, public health, the AGPL source link, fail-closed workspace readiness, and rollback to a retained build.

The final WO-0005 network rollout was `build-2026-10-04-005`, serving application commit `dc3e45ca8a5684092dd2969b6dceced81051c5d5`. The PR was then squash-merged to main at `8d4c9b3`; the application difference after that merge is deployment-report/control-plane history, not new product behavior.

The predecessor `missionism` Firebase backend remains independent and untouched.

## Release model

- accepted code lives on `main`;
- automatic App Hosting rollouts remain off;
- releases are promoted manually by exact commit;
- the generated `hosted.app` URL remains the fallback/recovery endpoint;
- domain changes do not authorize workspace production infrastructure.

## Dependency-security state

Two temporary ADR-010 exceptions remain, both expiring 2026-11-03:

- `GHSA-m9gg-hp2v-232j` on `@grpc/grpc-js 1.9.16`, installed only through the unused Firebase client Firestore path and guarded against Firestore imports;
- `GHSA-vfj7-8cjw-p6xm` on `braces 3.0.3`, development-only in the lint toolchain and currently unpatched upstream.

The dependency-security CI policy remains required for every accepted release.

## Product not yet implemented here

The first intended 99pct loop remains:

Mission → Project → Work → Join → Contribution → MCU history.

Also not implemented: public contribution profiles, production MCU ledger, passkeys, progressive verification providers, legal equity settlement, payments, repurchase, financing, or secondary liquidity.

## Active next step

Execute `docs/work-orders/WO-0006-99pct-domain-cutover.md`.

WO-0006 may change only the web-routing DNS records required to connect `99pct.com` and `www.99pct.com` to the already-proven 99pct backend. Registrar transfer, nameserver transfer, email DNS changes, workspace production, and automatic rollouts remain unauthorized.
