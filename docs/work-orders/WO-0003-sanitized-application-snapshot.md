# WO-0003 — Sanitized application snapshot

## Goal

Import a public-safe snapshot of the existing private Missionism application into this repository **without publishing private Git history, leaking private material, changing production, or redesigning the application**.

This is a migration order, not a product-feature order.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/implementation-reports/WO-0002-migration-preflight.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- ADR-003, ADR-006, ADR-007 in `docs/DECISIONS.md`
- `LICENSE_SCOPE.md`

## Source

Private repository: `bryan-benchmark/missionism`

Tracked source tree:

`321d4b6cf88737c096918cad51069f2294e8c934`

Do not use the developer working directory as the source. Do not merge, mirror, push, or graft the private repository's Git history.

## Required process

### 1. Build the candidate outside the public repo

Create a temporary directory outside the 99pct Git worktree.

Populate it only from:

`git archive 321d4b6cf88737c096918cad51069f2294e8c934`

Do not use `cp -R`, Finder, rsync from the dirty working tree, or another method that can sweep in ignored/untracked files.

### 2. Apply the publication denylist privately

Before anything is copied into the public repository, remove:

- named-person compensation, employment-deal, or role-negotiation documents;
- private corporate/formation/legal records;
- local database dumps and local prototype data files;
- debug output and review archives;
- environment files;
- generated dependency/build output;
- unrelated sibling projects;
- office-document binaries not needed to build;
- nonessential brand archives/binaries;
- helper scripts whose only purpose is shipping private corporate records.

Do not put excluded people's names, compensation terms, private filenames, or local absolute paths into the public PR/report.

Keep tracked application/prototype source code unless it is excluded for privacy/security or collides with the control plane. Experimental code may remain code; it must not be re-described as production MCU/equity behavior.

### 3. Protect control-plane paths

The snapshot must not overwrite:

- `AGENTS.md`
- root `README.md`
- `LICENSE`
- `LICENSE_SCOPE.md`
- `spec/README.md`
- `spec/canonical.json`
- `docs/VISION.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_INVARIANTS.md`
- `docs/DATA_MODEL.md`
- `docs/DECISIONS.md`
- `docs/CURRENT_STATE.md`
- `docs/NEXT.md`
- `docs/work-orders/`
- `docs/implementation-reports/`

Compare the archived `spec/canonical.json` byte-for-byte with the public repo copy. Stop on any difference.

### 4. Make the application license explicit

In the imported application `package.json`, set:

`"license": "AGPL-3.0-only"`

Do not apply that field to third-party packages or claim that `docs/` / `spec/` are AGPL-covered.

Do not change application behavior for licensing in this order. A visible network-source link is required before public deployment, not during this snapshot import.

### 5. Scan before copying to the public worktree

Run a standard secret scanner against the sanitized candidate directory **before** copying it into 99pct.

Preferred: `gitleaks dir <candidate> --redact`.

A current TruffleHog filesystem scan is an acceptable substitute.

Record the scanner name, version, command class, and pass/fail result. Never record discovered secret values.

If no standard scanner is available, stop before public push and report the blocker. Do not substitute only a custom regex scan.

Also perform a privacy/publication review of the candidate for:

- named-person compensation/employment material;
- private legal/corporate records;
- personal email/contact data not intentionally public;
- local-machine absolute paths;
- database dumps;
- environment/credential files;
- private review archives.

Review matches. Do not globally allowlist broad categories to make the scan green.

### 6. Copy the sanitized candidate into the 99pct worktree

Use branch:

`wo/0003-sanitized-application-snapshot`

Do not overwrite the protected control-plane paths.

The resulting commit history must have only 99pct commits as parents. The private repository's commits must not become ancestors of this branch.

The import commit message should name `321d4b6` only as the source tree provenance.

### 7. Verify the imported application

From the imported 99pct application run:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Do not delete, skip, or weaken tests to obtain green results.

If a publication-safety edit breaks the build, make the smallest migration-only correction and record it.

### 8. Audit the public diff before push

Confirm:

- no private Git history;
- no raw secret values;
- no private named-person compensation/employment documents;
- no local database dumps;
- no `.env` files;
- no private corporate records;
- no local absolute developer-machine paths introduced by the migration;
- `spec/canonical.json` unchanged;
- protected control-plane files unchanged except where this work order explicitly permits no changes;
- root `LICENSE` and `LICENSE_SCOPE.md` remain intact;
- imported `package.json` says `AGPL-3.0-only`.

Only after those checks may the branch be pushed/opened as a public PR.

## Durable report

Create:

`docs/implementation-reports/WO-0003-sanitized-application-snapshot.md`

The report may include:

- source commit;
- categories kept/omitted;
- scanner tool/version and pass/fail;
- test/build results;
- migration-only deviations;
- file counts;
- known remaining risks.

It must not include:

- secret values;
- excluded people's names;
- private compensation/employment terms;
- private filenames that identify people;
- local absolute paths.

## Out of scope

- Firebase/backend retargeting
- domain/DNS changes
- production deployment
- database creation or migration against shared infrastructure
- product redesign
- Mission/Product feature implementation
- MCU ledger implementation
- equity issuance
- passkey work
- protocol/document relicensing
- cleaning up old terminology merely because it is old

## Acceptance

1. Application code exists in 99pct from the exact tracked source tree, with publication-safe exclusions.
2. No private predecessor Git history is present.
3. A standard pre-publication secret scan passes.
4. Privacy/publication review passes.
5. Canonical claim bytes are unchanged.
6. Control-plane files remain authoritative and unoverwritten.
7. `package.json` declares `AGPL-3.0-only`.
8. `npm ci`, verify, lint, typecheck, and build all pass.
9. Production infrastructure is untouched.
10. The durable report contains evidence without private material.

## Return

Open the PR and stop.

Do not deploy.
Do not start WO-0004.
