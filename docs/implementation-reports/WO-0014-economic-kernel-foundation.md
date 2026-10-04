# WO-0014 — Economic kernel foundation

## Result

99pct now has an isolated economic kernel in source. It is not wired to production routes, and its schema was not applied to the production Mission database.

- Pull request: https://github.com/bryan-benchmark/99pct/pull/28
- Kernel commit: `3e485739e0fdcf67472f059442bed82ae5de88f6`
- CI head that included the kernel and the accepted 99pct shell: `5947e65c6bcc8f44cd6f29457303571f0ef659e3`
- GitHub Actions run `37244439753` passed both jobs on that head
- No production migration, rollout, MCU, bounty, money movement, or legal-ownership change

The kernel lives in `src/economic/`. Mission product migrations stay `0001` through `0005`.

## Schema

Disposable migrations live in `src/economic/db/migrations/` and use the `economic` schema. `0001_economic_kernel.sql` creates:

| Table | Role |
|---|---|
| `commands` | One receipt per Mission idempotency key. Stores the canonical command hash and payload. |
| `events` | Append-only per-Mission sequence, payload hash, previous hash, and event hash. |
| `rule_versions` | Immutable published rule definitions. No mutable active flag. |
| `reward_keys` | Unique `(mission_id, reward_key)` so a logical reward cannot be inserted twice. |
| `schema_migrations` | Checksummed economic migration history, separate from Mission migrations. |

Update, delete, and truncate triggers reject changes on those tables. The migrator refuses a connection to the production `missions` database or `pct99-missions-prod`.

## Command, event, and rule model

A command is not economic truth. `commitCommand` locks the Mission, replays an identical idempotency key, and rejects the same key with different canonical content. The pure `evaluate` function then returns a refusal or a batch of event drafts. Hashes, ids, and timestamps are applied only when the batch is sealed. The inserts share one serializable transaction, so a refusal leaves no partial events.

Events are hash-linked per Mission with SHA-256 over canonical JSON (`economic-event-v1`). Canonical encoding sorts object keys and rejects numbers, so JavaScript key order and floating-point values cannot enter the hash. Private field names such as email, uid, note, session, password, ssn, and secret are rejected.

Rule activation is an event. The reference rule kind is `fixed_mcu_on_recognition`. It exists to prove the kernel, not as final Mission economics. A later version does not rewrite an earlier grant. A bounty reward uses the rule version pinned in its published terms, not whatever rule is active at completion time.

## Quantities and hashes

MCU amounts are `bigint` minor units. The fixed scale constant is `6` (1 MCU = 1,000,000 minor units). That scale is recorded on the rule version and is not a UI promise. Wire and export amounts are canonical integer strings. The safe range is `-(10^38-1)` through `10^38-1`, matching `numeric`-scale room without using JavaScript `number`.

Payload hash and event hash are lowercase SHA-256 hex of the shared canonical form. Writer, export, and verifier use that same canonicalizer.

## Idempotency and concurrency

Uniqueness of `(mission_id, idempotency_key)` is enforced in PostgreSQL. Processing also takes a per-Mission advisory transaction lock and runs at serializable isolation. A retried command returns the original command id and event ids.

Every grant carries a stable reward key. Contribution rewards use `contribution:{mission}:{contribution}:{contributor}`. Bounty rewards use `{mission}:{bounty}:{beneficiary}:{completion}`. The `reward_keys` primary key is the backstop if two workers pass the in-memory check.

Disposable PostgreSQL 18, locally and in CI, ran two concurrent connections:

- the same recognition command produced one command and one MCU grant;
- two different commands for the same satisfied bounty produced one reward and one refusal;
- the hash chain stayed contiguous.

## Database roles

CI creates `economic_ci_runtime` and `economic_ci_verifier` on database `economic_check` only.

The runtime role may `SELECT` and `INSERT` on command, event, rule, and reward tables. It may only `SELECT` the migration table. It cannot update, delete, truncate, own the tables, or create schema objects. The verifier role is `SELECT` only. Negative SQL checks cover runtime update, delete, and truncate, plus a verifier insert.

## Export and verifier

`exportMission` writes one Mission as `economic-export-v1` NDJSON: header, rule definitions, command receipts, then events in sequence. Amounts stay decimal strings. The export has no email, Firebase uid, session, or note fields.

`npm run economy:verify -- <file>` checks format, sequence, payload hashes, event hashes, previous-hash links, rule definition hashes, command hashes, command references, integer amounts, and unique reward keys. It does not need database credentials and returns non-zero on failure.

Tamper copies fail for an edited amount, edited subject, edited rule version, deleted event, reordered events, a duplicated event, a broken previous hash, an altered rule definition, and a duplicated reward key.

## Reference flows

Contribution: publish fixed rule v1, activate it, recognize one synthetic contribution, and append exactly one MCU grant citing the Mission, contributor ref, contribution ref, evidence ref, rule id/version, and command. A replay does not grant again. An adjustment appends a signed compensating event that references the original grant. The original amount stays in history. Derived MCU total is the sum of grants and adjustments. Publishing v2 changes only the next grant.

Bounty: publish terms that pin a rule version and terms hash, confirm participation, then recognize completion. The kernel appends one completion fact and one reward. The reward amount comes from the pinned version even if a larger version was activated afterward. A second completion command does not create a second reward.

Derived reads are `mcuTotal`, `mcuHistory`, `bountyState`, and `rewardIssued`. There is no balance column and no set-balance function.

## AI boundary

`AiProposal` is a separate type. `commitCommand` rejects `kind: "ai_proposal"` before opening the database. `authorizeAiProposal` can turn a recognition proposal into a normal command only when a recognition process authorizes it. The decision module does not call a model, the network, the clock, or a random id generator. The boundary module does not call `commitCommand`.

## Threat model

The kernel is built so ordinary bugs, retries, concurrency, stale workers, UI mistakes, admin mistakes, row edits, deleted history, and post-hoc rewriting cannot silently change economic truth. Those cases were tested.

It does not claim safety after simultaneous compromise of the application, the database owner, the cloud control plane, and every future signing authority. Hash chaining detects tampering of an existing export. It does not, by itself, prove that an attacker who can rewrite the database and rehash the whole chain did not do so. Signed checkpoints are later hardening, not this order.

Money remains outside this kernel. There is no custodial cash balance. Legal ownership is not represented. An MCU event is not a stock certificate.

## What did not change

- Production Mission schema, rows, grants, and Auth
- App Hosting config, secrets, and rollouts
- DNS and the parked custom-domain work
- The predecessor backend
- No economic API route was added
- No user-facing MCU or bounty UI was added

## CI

Run `37244439753` on `5947e65c6bcc8f44cd6f29457303571f0ef659e3`:

- `dependency-security` passed
- `functional` passed, including Workspace and Mission PostgreSQL paths, economic migration of disposable `economic_check`, runtime and verifier role checks, and the concurrent reward test

Local `npm ci`, `npm run verify`, `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, and `npm run check:npm-audit` passed before the pull request. Audit policy remained `high=9 moderate=0 critical=0`. A separate disposable PostgreSQL 18 cluster also passed the role check and the race test before CI.
