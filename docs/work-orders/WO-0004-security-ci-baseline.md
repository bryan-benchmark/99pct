# WO-0004 — Security + CI baseline

## Goal

Turn the imported application into a trustworthy **pre-deployment baseline**:

1. understand every current moderate-or-higher npm advisory;
2. remediate everything that can be safely remediated without product/framework redesign;
3. mechanically bound any genuinely unavoidable temporary exceptions under ADR-010;
4. make the complete functional CI and dependency-security CI green.

This is a security/CI work order, not a product-feature or deployment work order.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/SECURITY_INVARIANTS.md`
- ADR-003, ADR-008, ADR-010 in `docs/DECISIONS.md`
- `docs/implementation-reports/WO-0003-sanitized-application-snapshot.md`
- current `.github/workflows/workspace-checks.yml`
- current `package.json` and `package-lock.json`

## Starting evidence

At the accepted WO-0003 baseline:

- install passes;
- 81 tests pass;
- lint passes;
- typecheck passes locally;
- build passes locally;
- GitHub Actions stops at `npm audit --audit-level=moderate`;
- 10 high-severity npm findings are reported;
- because the audit step fails early, the later CI build/PostgreSQL migration/runtime-role/smoke/restore/audit steps do not run.

Known classes include:

- an old `@grpc/grpc-js` installed through Firebase's Firestore dependency tree even though the application currently uses Firebase Auth and has no intended Firestore product dependency;
- brace/glob findings in development/lint tooling, including at least one currently unpatched `braces` advisory.

Treat this as starting evidence, not as a pre-approved exception.

## Branch

`wo/0004-security-ci-baseline`

## 1. Produce an exact advisory inventory

Run:

`npm audit --json`

For every moderate/high/critical advisory, record:

- GHSA/CVE when available;
- vulnerable package and installed version;
- dependency path from a direct dependency;
- whether the package is runtime, build-time, development-only, or installed-but-unreachable;
- whether 99pct passes untrusted input to the affected API/path;
- patched version, if one exists;
- remediation attempted;
- final disposition: fixed or temporary exception.

Do not paste secrets or irrelevant full dependency dumps into the report.

## 2. Remediate safely first

Prefer, in order:

1. lockfile-compatible patch/minor updates;
2. `npm audit fix` **without** `--force`, followed by full diff review;
3. a small direct-dependency update that stays within the current architecture;
4. removing a dependency only if it is truly unused and removal does not redesign the application.

Do not:

- run `npm audit fix --force`;
- downgrade Firebase/Next/React simply to satisfy the scanner;
- switch auth, database, hosting, or framework;
- add broad npm audit ignores;
- mark all dev dependencies safe by category;
- disable the security gate.

Any dependency change must pass the full application verification suite.

## 3. Handle unavoidable exceptions under ADR-010

If an advisory cannot safely be removed in this order, create a machine-readable exception file, for example:

`security/npm-audit-exceptions.json`

Each exception must contain at minimum:

- advisory ID;
- package;
- exact installed version or bounded version condition;
- dependency path/scope;
- classification: runtime / build-time / development-only / unreachable;
- evidence/rationale;
- upstream issue/advisory reference;
- accepted date;
- review/expiry date no later than 30 days after acceptance.

Create a repository script, for example:

`scripts/check-npm-audit.mjs`

that consumes current `npm audit --json` output and the exception file.

It must fail CI when:

- a new moderate-or-higher advisory appears;
- a known advisory changes package/path/version outside its accepted condition;
- an exception is expired;
- an advisory is not explicitly fixed or excepted.

Do not implement a script that simply converts npm audit exit 1 to exit 0.

### Firebase / gRPC evidence requirement

If the Firestore → old gRPC finding remains as an exception rather than being eliminated:

- prove from source imports that 99pct does not use Firestore;
- add a small mechanical guard/test that fails if application source begins importing Firestore while that exception exists;
- record why the affected Node Firestore transport is unreachable in the current application;
- record the upstream Firebase dependency issue;
- give the exception an expiry.

Do not claim "Firebase uses it, therefore safe."

### Dev-tooling evidence requirement

If an unpatched brace/glob finding remains:

- prove the dependency is development/build tooling only;
- identify what inputs reach it;
- show that untrusted user input is not passed into the affected glob expansion path;
- expire the exception.

## 4. Restructure CI so security and functional evidence are independent

The current single job stops at npm audit, hiding later functional evidence.

Split or reorder CI so we get both:

### Functional job

Must run to completion:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx tsc --noEmit`
- staging-marked `npm run build`
- disposable PostgreSQL migration
- environment binding
- restricted runtime-role grant/check
- PostgreSQL customer smoke
- audit-integrity check
- logical backup/restore
- restored-record/audit verification

### Dependency-security job

Must run independently:

- `npm ci`
- current npm audit JSON generation
- repository audit-policy checker

Both jobs must be green for acceptance.

Do not use `continue-on-error` for either final gate.

## 5. Pin third-party GitHub Actions

Pin imported third-party GitHub Actions to immutable full commit SHAs rather than floating major tags.

Keep a human-readable comment indicating the intended action/version.

Do not add unnecessary third-party actions.

## 6. Preserve product behavior

This work order must not intentionally change:

- public product behavior;
- Missionism/99pct philosophy;
- MCU math;
- authorization semantics;
- database schema;
- Firebase project/backend targets;
- domain/DNS;
- production environment.

If a dependency remediation unexpectedly changes product behavior, stop that remediation and report it.

## 7. Verification

Required locally after final dependency state:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- repository npm-audit policy check

Required in GitHub Actions:

- functional job: green through build + PostgreSQL restore/audit
- dependency-security job: green

If the workflow cannot become green without violating ADR-010, stop and report the blocker rather than weakening the policy.

## Durable report

Create:

`docs/implementation-reports/WO-0004-security-ci-baseline.md`

Include:

- before/after advisory count by severity;
- each advisory disposition;
- dependency changes;
- temporary exceptions and expiry dates;
- evidence for reachability classification;
- CI job/run results;
- any remaining deployment blockers.

## Out of scope

- production deployment;
- Firebase/backend retargeting;
- domain cutover;
- shared-database migration;
- new product features;
- Mission/Project/Work implementation;
- MCU protocol reconciliation;
- AGPL source-link UI;
- document/protocol licensing.

## Acceptance

1. Every current moderate/high/critical npm advisory is either safely fixed or explicitly covered by a valid ADR-010 exception.
2. No blanket/broad audit suppression exists.
3. Any Firebase/gRPC exception has a mechanical no-Firestore guard and expiry.
4. Any dev-only unpatched exception has reachability evidence and expiry.
5. GitHub Actions use immutable action SHAs.
6. Full functional CI runs and passes, including build and PostgreSQL smoke/restore/audit.
7. Dependency-security CI runs and passes under the repository policy.
8. Local install, verify, lint, typecheck, and build pass.
9. No production infrastructure is changed.
10. Durable security report is complete.

## Return

Open the PR and stop.

Do not deploy.
Do not start the next work order.
