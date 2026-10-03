# WO-0002 — Migration preflight

Date: 2026-10-03  
Source repository: private `bryan-benchmark/missionism`  
No application code was copied. Firebase, databases, domains, and production were not changed.

## Source snapshot

| Tree | Commit | Use |
|---|---|---|
| Production `main` | `4747bf3` | Existing explanatory site and simulators |
| Proposed sanitized snapshot | `321d4b6` on `feat/mission-workspace-v1` | Production tree plus 9 tracked feature commits |

Use only the tracked Git tree at `321d4b6`. Do not copy the developer working directory and do not publish the private repository's Git history.

## Verification

Run against the private predecessor on Node v22.23.3:

| Check | Result |
|---|---|
| `npm run verify` | Exit 0 — 81 passed, 0 failed |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit` | Exit 0 |
| `npm run build` | Exit 0 |

The existing `verify` command does not include the experimental talent invariant file. That file is not relied on for the migration baseline.

A custom history/blob scan found no matches for the credential classes it checked. Standard secret-scanning tools were not installed, so this custom scan is **not** sufficient as the final publication gate. The migration work order must run a standard secret scanner before files enter the public PR.

## Stack to preserve

ADR-003 stands. Do not rewrite the stack during migration.

- Next.js 16.3.6
- React 19.2.8
- TypeScript 5.9.3
- Tailwind 4
- Node >=22
- Firebase App Hosting
- Firebase Auth for the workspace
- PostgreSQL via `pg`
- PGlite for local workspace tests
- existing server-side workspace authorization
- append-only workspace history triggers
- restricted runtime database role
- workspace migrations 0001–0007
- export checksums
- existing canonical-claim rendering path

The Mission Units code is experimental. It is not the production MCU ledger and must not be represented as issued equity.

## Environment names

Values were not copied. Names referenced by code, hosting configuration, CI, or the workspace runbook include:

`DATABASE_URL`  
`FIREBASE_AUTH_EMULATOR_HOST`  
`FIREBASE_PROJECT_ID`  
`FIREBASE_SERVICE_ACCOUNT_JSON`  
`GOOGLE_CLOUD_PROJECT`  
`MISSION_EXPERIMENT_DATA_DIR`  
`MISSION_SPARK_DATA_DIR`  
`MISSION_TEAMUP_DATA_DIR`  
`MISSION_TOOLSHARE_DATA_DIR`  
`NEXT_PUBLIC_FIREBASE_API_KEY`  
`NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`  
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`  
`NODE_ENV`  
`WORKSPACE_DEV_DB_DIR`  
`WORKSPACE_EXPECTED_DATABASE_NAME`  
`WORKSPACE_EXPECTED_FIREBASE_PROJECT_ID`  
`WORKSPACE_LOCAL_TEST_RUNTIME`  
`WORKSPACE_MAINTENANCE_DATABASE_URL`  
`WORKSPACE_MIGRATION_DATABASE_URL`  
`WORKSPACE_RELEASE_TARGET`  
`WORKSPACE_RESTORE_DATABASE_URL`  
`WORKSPACE_TEST_DATABASE_URL`  
`WORKSPACE_TEST_MIGRATION_DATABASE_URL`

Hosting configuration references a secret by name rather than embedding its value. No tracked `.env` file was found.

## Privacy and publication risks

Credential scanning alone is not enough.

The private source contains tracked documents about identifiable people's compensation or role negotiations. Those documents must not be published. The public control plane should record the **category and rule**, not the person's name or the private filenames.

The developer working directory also contains ignored or untracked local artifacts such as database dumps, local prototype data, debug output, review artifacts, and private corporate records. A directory copy would be unsafe.

Therefore the migration must:

1. use `git archive` from the exact tracked commit, never a working-directory copy;
2. apply a private local denylist for personal compensation/employment/legal documents;
3. omit ignored/local-only artifacts by construction;
4. scan the candidate public tree for credentials **and** private/personal material before opening the public PR;
5. never paste discovered secret values, personal compensation terms, or private legal content into public reports.

## Deployment and database coupling

Production remains attached to the private predecessor.

- Existing Firebase configuration points at the current Missionism project/backend.
- The documented production rollout is tied to the predecessor repository's `main`.
- The feature workspace staging configuration is not a production workspace.
- Workspace code fails closed without required database/Firebase server configuration.
- No production workspace database is authorized for this migration.

The snapshot import must not:

- retarget Firebase;
- move the domain;
- run migrations against a shared database;
- restore local database dumps;
- create a new production backend.

## Keep / omit / reconsider

### Keep

From the tracked source tree, subject to the denylist and path-collision rules:

- existing explanatory application pages and used assets
- protocol/content/components required by the application
- workspace code and workspace API routes
- workspace database migrations
- workspace verification/runtime scripts
- package and build configuration
- CI workflow after publication-safe review
- public, non-personal protocol/spec documentation
- public deployment/workspace operational documentation

### Omit

- all named-person compensation, employment-deal, or role-negotiation documents
- private corporate/formation records
- local database dumps and local prototype records
- debug output and review archives
- environment files
- generated build/dependency directories
- unrelated sibling projects
- binary office documents unless a later work order explicitly proves they are required and public-safe
- predecessor files that would overwrite this repo's control-plane files

### Reconsider

Do not automatically migrate these merely because they exist:

- Spark/Pilot/experiment/team-up/toolshare prototypes that use local-disk persistence
- experimental Mission Units code
- experimental talent code
- brand archives and PDFs
- private-record shipping helper scripts

A later work order can include any of these deliberately.

## Canonical and control-plane collisions

The predecessor `spec/canonical.json` at the proposed source commit is byte-identical to the 99pct copy.

During migration:

- stop if the canonical checksums differ;
- retain 99pct's `AGENTS.md`;
- retain 99pct's root `README.md`;
- retain 99pct's `spec/README.md`;
- retain 99pct's `spec/canonical.json`;
- do not overwrite control-plane docs.

Older explanatory MCU documents may contain wording covered by ADR-005. Importing an explanatory document does not override ADR-001.

## Sanitized migration procedure

Do this only after the license gate is resolved.

1. Create a clean `git archive` from `321d4b6cf88737c096918cad51069f2294e8c934`.
2. Apply the private publication denylist. The denylist itself must not expose personal filenames in the public repo.
3. Remove nonessential binary/brand/private-record artifacts unless a work order explicitly retains them.
4. Compare archived `spec/canonical.json` byte-for-byte with the 99pct canonical file. Stop on any difference.
5. Add the sanitized snapshot to a new `wo/` branch without overwriting control-plane paths.
6. Confirm the resulting commit's parents belong only to 99pct history.
7. Run a standard secret scanner on the candidate tree and history visible from the migration PR.
8. Run a privacy/publication scan for personal names, private compensation/employment terms, private legal records, emails, dumps, and local-machine artifacts. Review matches rather than blindly allowlisting them.
9. Run `npm ci`, `npm run verify`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
10. Open the import PR. Do not deploy, retarget Firebase, move the domain, or touch a shared database.

Synthetic CI credentials may remain only when clearly test-only and publication-safe. If a scanner flags them, refactor the fixture or add a narrow documented allowlist; do not weaken broad scanning rules.

## Rollback

For the later import:

- Before merge: close the PR. Production remains untouched.
- After merge but before deployment: revert the import commit if needed.
- Do not combine the import with a database migration or domain/backend cutover.
- A later deployment cutover must keep the existing production backend available as the rollback target until the new baseline is verified.

## License gate

The predecessor application has no project license. ADR-007 remains unresolved.

Do not publish the application snapshot into this public repository until the product owner accepts an open-source licensing decision.
