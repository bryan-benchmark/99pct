# WO-0004 — Security + CI baseline

Date: 2026-10-04

No production system, Firebase project, domain, or shared database was changed.

## Advisory counts

| | moderate | high | critical |
|---|---:|---:|---:|
| Before `npm audit fix` | 0 | 10 | 0 |
| After | 0 | 9 | 0 |

The drop is one vulnerability key, `brace-expansion`, whose patched releases are now installed. The remaining 9 high keys are two advisories reported again on each dependent package.

## Dispositions

### Fixed

`npm audit fix` without `--force` updated the lockfile only:

- `brace-expansion` 1.1.18 → 1.1.21, under `eslint` → `minimatch`
- `brace-expansion` 5.0.9 → 5.0.12, under `eslint-config-next` → `typescript-eslint`
- `eslint-config-next` and `@next/eslint-plugin-next` 16.3.6 → 16.3.8, still inside the existing `^16.3.6` dev range, because that is how the nested 5.0.12 copy is resolved

`next` stays 16.3.6. Direct dependency ranges in `package.json` were not edited except adding the `check:npm-audit` script.

Advisories removed with those versions:

- GHSA-q2hr-2g5m-vwhr
- GHSA-qhr7-859c-m2p7
- GHSA-6j4f-fj2g-mc7p

`brace-expansion` 2.1.7, under `firebase-admin`'s `glob` → `minimatch`, was already outside the vulnerable range and was left in place.

`npm audit fix --force` was not run. It would downgrade `firebase` to 9.14.0 or `eslint-config-next` to 14.2.35.

### Temporary exceptions

Both expire on 2026-11-03. The checker rejects a review window longer than 30 days, an expired date, a version or install path outside the record, and any new moderate-or-higher advisory.

| Advisory | Package | Version | Class | Path |
|---|---|---|---|---|
| GHSA-m9gg-hp2v-232j | `@grpc/grpc-js` | 1.9.16 | unreachable | `firebase@12.19.0 > @firebase/firestore@4.17.2 > @grpc/grpc-js@1.9.16` |
| GHSA-vfj7-8cjw-p6xm | `braces` | 3.0.3 | development-only | `eslint-config-next@16.3.8 > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3` |

Carried package keys that npm still labels high, and that the checker allows only through those paths: `@firebase/firestore`, `@firebase/firestore-compat`, `firebase`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next`.

GHSA-f596-whhp-79r4 is a low-severity finding on the same `@grpc/grpc-js` 1.9.16 copy. It is below the moderate gate, so it is not an exception. It remains visible to `npm audit`.

## Reachability

### GHSA-m9gg-hp2v-232j

`@firebase/firestore` 4.17.2 depends on `@grpc/grpc-js` `~1.9.0`. That line's newest install here is 1.9.16, and the advisory is fixed only in 1.13.6 and later. The patched copies in this tree are `@grpc/grpc-js` 1.14.5, reached from `firebase-admin` → `@google-cloud/firestore`, not from the client Firestore package.

Application imports are `firebase/app`, `firebase/auth`, `firebase-admin/app`, and `firebase-admin/auth`. Nothing imports Firestore. The vulnerable client transport is therefore installed and not called. `scripts/check-no-firestore.mjs` fails the security job if `src` or `scripts` gains a Firestore import while this exception exists.

Upstream reference: https://github.com/advisories/GHSA-m9gg-hp2v-232j. Firebase's client Firestore package still declares the `~1.9.0` range; the non-breaking audit fix cannot leave that range.

### GHSA-vfj7-8cjw-p6xm

`braces` 3.0.3 is the current 3.x release and the advisory lists no patched version. Its only install path is the ESLint configuration used by `npm run lint`. Application source does not import `braces`, `micromatch`, or `fast-glob`, and request handling does not pass user input into brace expansion.

## CI

`.github/workflows/workspace-checks.yml` now has two jobs, neither with `continue-on-error`:

- `functional`: `npm ci`, verify, lint, `next typegen`, `tsc --noEmit`, staging build, disposable PostgreSQL migration, environment binding, restricted runtime role, customer smoke, audit-integrity check, logical backup/restore, and restored-record verification
- `dependency-security`: `npm ci`, the policy unit tests, and `npm run check:npm-audit`

`actions/checkout` and `actions/setup-node` are pinned to full commit SHAs, with the v7 tag noted in a comment.

The first functional run failed in `tsc` because a clean checkout does not contain gitignored `next-env.d.ts` or `.next/types`. `next typegen` now runs immediately before `tsc`.

## Local verification

Node v22.23.3:

| Command | Result |
|---|---|
| `npm ci` | Exit 0 |
| `npm run verify` | Exit 0. 81 passed, 0 failed |
| `npm run lint` | Exit 0 |
| `npx next typegen` | Exit 0. Required before typecheck on a clean tree because `next-env.d.ts` and `.next/types` are gitignored |
| `npx tsc --noEmit` | Exit 0 |
| `npm run build` | Exit 0 |
| `npm run check:npm-audit` | Exit 0. Policy accepts the two exceptions. `npm audit` still reports 9 high |

GitHub Actions job results are recorded on the WO-0004 pull request.

## Remaining deployment blockers

- These exceptions expire on 2026-11-03. A later order has to remove them or replace them with a still-valid exception. They are not a deployment approval.
- Firebase configuration still names the predecessor project. This order did not retarget it.
- The public interface still has no corresponding-source link. ADR-007 requires that before a public network deployment.
- `npm` prints a deprecation warning for `glob` 10.5.0 under `firebase-admin`. That warning is not a moderate-or-higher audit advisory and was not changed here.
