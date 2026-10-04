# WO-0014 — Economic kernel foundation

## Goal

Build the first trustworthy economic kernel for 99pct.

This is infrastructure-only.

It must prove in code and disposable PostgreSQL that future MCU issuance and bounty rewards can be:

- append-only;
- deterministic;
- idempotent;
- race-safe;
- rule-versioned;
- tamper-evident;
- independently verifiable;
- rebuildable.

Do not integrate this kernel into production UI/routes or apply its schema to the production database.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/ECONOMIC_KERNEL.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-001, ADR-002, ADR-020 in `docs/DECISIONS.md`
- `docs/PRODUCT.md`
- current Mission PostgreSQL migration/CI patterns for reference only

## Branch

`wo/0014-economic-kernel-foundation`

## Hard boundaries

Do not:

- apply economic migrations to production;
- deploy economic routes;
- issue a production MCU;
- publish a production bounty;
- create/edit legal ownership;
- move/custody money;
- add a mutable authoritative balance;
- add a mutable authoritative bounty-status field;
- add an admin set-balance/grant endpoint;
- run arbitrary user/Mission JavaScript as a rule;
- use JavaScript floating point for MCU quantities;
- allow an LLM result to create economic events directly;
- alter production Mission migrations/data;
- change DNS/custom domains;
- resume WO-0013 product-shell work in this PR.

## 1. Isolated economic module

Create a dedicated module such as:

`src/economic/`

It must not be hidden inside Mission UI/store code.

Suggested boundaries:

- `commands/`
- `events/`
- `rules/`
- `engine/`
- `db/`
- `export/`
- `verify/`

Keep domain logic framework-independent where practical.

## 2. Independent migration path

Create a separate economic migration path, e.g.:

`src/economic/db/migrations/`

Do not add these files to the existing production Mission migration registry.

WO-0014 CI creates a disposable PostgreSQL 18 database/schema and runs economic migrations independently.

Initial schema namespace:

`economic`

No production binding in this order.

## 3. Command receipts / idempotency

Add append-only command receipts.

Minimum fields:

- command UUID;
- Mission UUID/ref;
- command type;
- idempotency key;
- canonical command hash;
- actor kind/ref;
- received timestamp.

Required uniqueness:

`(mission_id, idempotency_key)`

Behavior:

- same Mission + key + same canonical content → return/recover same logical result;
- same Mission + key + different content → hard conflict;
- no second economic event batch from retry.

No UPDATE/DELETE through runtime.

## 4. Economic events

Add append-only event storage.

Minimum fields:

- event UUID;
- Mission id/ref;
- per-Mission sequence;
- event type;
- command id;
- actor kind/ref;
- subject kind/ref;
- rule id/version nullable;
- canonical payload;
- canonical payload hash;
- previous event hash nullable for genesis;
- event hash;
- recorded timestamp.

Constraints:

- unique event id;
- unique `(mission_id, sequence)`;
- sequence positive;
- command reference valid;
- quantities/refs validated by event-type codec;
- UPDATE/DELETE refused by trigger + runtime grants.

Do not store private email/session data in economic payload fixtures.

## 5. Canonical encoding + hash chain

Define a versioned canonical economic-event encoding.

Do not rely on incidental JavaScript object-key order.

Implement one shared canonicalizer used by:

- writer;
- export;
- verifier.

Use SHA-256 for the first hash-chain version.

Hash links are per Mission.

Test:

- valid chain;
- payload mutation;
- deletion;
- insertion;
- reorder;
- sequence duplication;
- broken previous hash.

## 6. Integer MCU unit

Define an MCU smallest-unit type.

Requirements:

- runtime authoritative amount is `bigint`;
- wire/export amount is decimal string;
- parser rejects decimals/floats/scientific notation unless explicitly supported by the chosen canonical integer format;
- range bounded to a documented maximum safe database value;
- addition/subtraction overflow/range checked.

Choose a fixed display scale constant but do not make UI commitments around it yet.

## 7. Immutable rule registry

Create immutable published rule versions.

Minimum identity:

- Mission id;
- rule id;
- version;
- rule kind;
- canonical definition;
- definition hash;
- published-at event/sequence.

Do not store mutable `active=true` as authority.

Rule activation is an economic event.

At minimum implement a constrained test/reference MCU rule kind:

`fixed_mcu_on_recognition`

Definition includes a fixed integer-smallest-unit amount.

This rule exists only to prove the kernel, not as final Mission economics.

Published rule rows are UPDATE/DELETE protected.

## 8. Pure deterministic engine

Create a pure command/state-transition boundary.

Conceptually:

`evaluate(history/state, command, exactRules) → refusal | EventDraft[]`

The decision code must not:

- access network;
- read current wall-clock time directly;
- call random UUID generation directly;
- call an LLM;
- query external providers;
- use floating point.

Inject IDs/timestamps needed for recorded envelopes outside the reward decision.

Event outcome/reward quantities must be reproducible.

## 9. Reference Contribution → MCU flow

Build a sandbox/reference flow proving:

1. publish fixed MCU rule v1;
2. activate v1;
3. record a synthetic recognized Contribution fact;
4. deterministic engine emits exactly one MCU grant referencing:
   - Mission;
   - contributor public/test ref;
   - Contribution ref;
   - rule id/version;
   - command;
5. derived MCU total equals sum of grants/adjustments.

Do not expose this through production routes.

A repeated recognition/reward command cannot double-grant.

## 10. Compensating adjustment

Implement a kernel-level compensating MCU event.

It must:

- reference the original grant/adjustment;
- carry signed integer-smallest-unit delta;
- record reason reference;
- be append-only;
- leave original history intact.

No generic “set balance.”

Tests rebuild the same final total from history.

## 11. Reference bounty state machine

Implement a sandbox/reference bounty flow sufficient to prove reward autonomy.

Minimum facts:

- bounty terms published;
- terms include exact reward rule ref/version and immutable terms hash;
- completion/satisfaction recognized;
- kernel emits at most one reward grant under a stable reward key.

Do not implement product UI, claiming, money, or production Work integration.

The reference flow may use synthetic subject ids.

Required race test:

Two concurrent attempts to process the same satisfied bounty must result in exactly one logical reward/grant.

## 12. Stable reward key

Define a deterministic stable key for every logical reward.

For the reference bounty use a composition such as:

`mission + bounty + beneficiary + milestone/completion`

Store/enforce uniqueness at the DB level.

Do not rely only on application checks.

## 13. Derived views

Provide read functions/views for:

- MCU total by Mission + beneficiary;
- MCU event history;
- bounty derived state;
- whether reward key has been issued.

No direct setter.

If a cached projection table is introduced, tests must delete/rebuild it from events and obtain identical state. Prefer pure query/view first unless performance requires cache.

## 14. DB roles / least privilege

Create SQL grant scripts/checks for disposable CI.

At minimum distinguish:

- migration/owner role;
- economic runtime role;
- verifier/read role if useful.

Runtime must not receive:

- UPDATE/DELETE/TRUNCATE on event history;
- UPDATE/DELETE on rule versions;
- schema ownership;
- arbitrary migration-table mutation;
- superuser.

If runtime has INSERT rights, constrain them to the exact tables/functions required.

Add negative SQL tests.

## 15. Serializable/race-safe command commit

Critical command processing must use a transaction strategy safe under concurrency.

Use either:

- PostgreSQL SERIALIZABLE with retry handling; or
- explicit locking/unique constraints with demonstrated equivalent behavior.

Tests must create real concurrent connections and prove:

- duplicate command race → one result;
- duplicate bounty reward race → one result;
- sequence allocation remains valid;
- hash chain remains valid.

Sequential unit tests alone do not satisfy this requirement.

## 16. Export format

Define a versioned canonical export for one Mission's economic history.

Recommended NDJSON or similarly streamable format.

Export contains:

- format/version metadata;
- rule definitions referenced by the history;
- command receipts needed to verify idempotency/provenance;
- economic events in sequence.

Exclude private identity fields.

Amounts remain decimal strings.

## 17. Offline verifier

Add a standalone verifier usable without application runtime state.

Example command:

`npm run economy:verify -- <export-file>`

It must verify at minimum:

- schema/format version;
- event sequence;
- hash chain;
- event hashes/payload hashes;
- rule definition hashes;
- rule/version references;
- command references;
- unique reward keys;
- valid integer quantities.

Return non-zero on failure.

The verifier must not need DB credentials.

## 18. Tamper tests

Generate a valid export then mutate copies.

Required failures:

- edit amount;
- edit subject;
- edit rule version;
- delete event;
- reorder events;
- duplicate event;
- break previous hash;
- alter rule definition;
- duplicate reward key.

## 19. Rule-version history test

Prove:

1. v1 rule grants X;
2. publish/activate v2 granting Y;
3. prior v1 event remains X;
4. new eligible command uses v2;
5. full replay produces X then Y;
6. verifier can resolve both immutable rule versions.

Never recompute old event amounts from currently active rule.

## 20. Fail-closed tests

Refuse without partial events:

- unknown rule;
- wrong Mission rule;
- inactive/unpublished rule;
- invalid command state;
- unauthorized synthetic actor;
- idempotency conflict;
- amount out of range;
- invalid canonical payload;
- broken history prefix/hash before new append.

## 21. AI boundary test/documentation

Add a clear API/type boundary such that an AI-produced proposal/evidence object is not itself an economic command.

There must be an explicit deterministic conversion/authorization step before it reaches the kernel.

A regression test or static structure test should make accidental direct AI → grant wiring difficult.

Do not add an AI dependency.

## 22. Threat-model / architecture report

Create:

`docs/implementation-reports/WO-0014-economic-kernel-foundation.md`

Include:

- schema;
- command/event/rule model;
- quantity representation;
- hash format;
- idempotency strategy;
- concurrency strategy;
- DB roles;
- export/verifier;
- reference Contribution/MCU test;
- reference bounty test;
- threat model;
- what the design does **not** protect against;
- all CI results;
- explicit confirmation no production schema/behavior changed.

Do not include secrets/private identities.

## 23. CI

Add a dedicated economic-kernel test command and include it in `npm run verify`.

Extend functional GitHub CI with an isolated disposable PostgreSQL 18 database for the economic kernel.

Existing Workspace + Mission PostgreSQL paths remain green.

Dependency-security remains green.

## 24. Local gates

Run:

- `npm ci`
- `npm run verify`
- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:npm-audit`

Both required GitHub Actions jobs must pass.

## 25. No production deployment

Do not:

- migrate production;
- add App Hosting economic env/secrets;
- deploy a new build merely for this kernel;
- expose economic API routes.

WO-0014 ends with a reviewed, adversarially tested kernel in source only.

## Acceptance

1. Economic commands are idempotent.
2. Economic events are append-only and hash-linked per Mission.
3. Rule versions are immutable and activation is historical.
4. MCU amounts use bounded integer smallest units.
5. Deterministic reference recognition creates exactly one MCU grant.
6. Corrections append compensating events; no set-balance path exists.
7. Reference bounty satisfaction emits exactly one reward under race/retry.
8. Runtime cannot UPDATE/DELETE economic event/rule history.
9. Concurrent PostgreSQL tests prove duplicate/race resistance.
10. Derived totals/state rebuild exactly from events.
11. Versioned export can be independently verified offline.
12. Tampering/deletion/reordering/rule mutation is detected.
13. Rule v2 cannot reinterpret prior v1 results.
14. Unknown/invalid states fail without partial history.
15. AI output cannot directly create an economic grant.
16. Existing Workspace/Mission CI remains green.
17. No production schema, MCU, bounty, money, ownership, DNS, or deployment change occurs.

## Return

Open the PR with all evidence and stop.

Do not integrate into production.
Do not implement user-facing MCU/bounty UI.
Do not resume WO-0013.
