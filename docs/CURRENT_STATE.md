# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized application snapshot imported and accepted in WO-0003
- WO-0003 merged at `5486675`
- Source provenance: private predecessor tracked tree `321d4b6`, imported without private Git history
- No 99pct production deployment yet
- Existing Firebase/domain/database production remains untouched
- `spec/canonical.json` remains the canonical short-claim source
- Application source license: `AGPL-3.0-only`

## Imported application baseline

The repository now contains the preserved Next.js/Firebase/PostgreSQL application baseline:

- Next.js 16 / React 19 / Node 22
- Firebase Auth and Firebase App Hosting configuration from the predecessor
- PostgreSQL Mission Workspace
- append-only workspace history
- server-side authorization
- migrations 0001–0007
- experimental Sparks/Pilots/Teamups/Toolshare/Mission Units code
- explanatory Missionism site and simulators

These imported systems are baseline/prototype code. They are not automatically the final 99pct product model.

## Verification at WO-0003

After the publication-safety rework:

- `npm ci`: pass
- `npm run verify`: 81 passed, 0 failed
- `npm run lint`: pass
- `npx tsc --noEmit`: pass locally
- `npm run build`: pass locally
- privacy/publication review: pass after neutralizing person-identifying financial/ownership examples
- standard secret scan: pass before public import

GitHub Actions currently fails at `npm audit --audit-level=moderate`, so later functional CI steps are skipped.

## Known dependency-security state

`npm audit` currently reports 10 high-severity findings.

Two distinct classes are already visible:

1. Firebase's installed Firestore dependency pins an older `@grpc/grpc-js` line even though 99pct currently uses Firebase Auth rather than Firestore.
2. Lint/glob tooling includes high-severity brace/glob advisories; at least one current `braces` advisory has no patched release.

Do not hide or broadly suppress these findings. Do not run `npm audit fix --force` blindly.

## Product not yet implemented here

The first intended 99pct loop remains:

Mission → Project → Work → Join → Contribution → MCU history.

Also not implemented: public contribution profiles, production MCU ledger, passkeys, progressive verification providers, legal equity settlement, payments, repurchase, financing, or secondary liquidity.

## Active next step

Execute `docs/work-orders/WO-0004-security-ci-baseline.md`.

No deployment, Firebase retargeting, domain cutover, or shared-database migration is authorized by WO-0004.
