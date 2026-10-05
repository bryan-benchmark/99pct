# WO-0015 — Economic production boundary / shadow ledger

## Goal

Move the accepted WO-0014 economic kernel from disposable PostgreSQL into a real production-grade boundary **without creating economic value**.

Successful outcome:

- production has a separate `economy` database boundary;
- economic migrations are applied there, not in the Mission product database;
- capability-separated submitter roles exist;
- the normal web application cannot append authoritative economic truth;
- the private kernel writer is isolated from App Hosting;
- command intents can be processed idempotently by a private worker;
- accepted/refused intent outcomes are append-only;
- backup/restore/export/offline verification work against the production economic database;
- checkpoint/signing format and KMS integration path are ready;
- zero real MCUs/bounty rewards exist.

This is a shadow-ledger deployment, not the first MCU release.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/ECONOMIC_KERNEL.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-020 and ADR-021 in `docs/DECISIONS.md`
- WO-0014 implementation report
- existing Mission Cloud SQL deployment/operator tooling

## Branch

`wo/0015-economic-production-boundary`

## Hard boundaries

Do not:

- issue a real MCU;
- publish or reward a production bounty;
- recognize a real Contribution;
- move/custody money;
- issue legal ownership;
- expose a public economic-mutation API;
- give App Hosting the kernel-writer credential;
- let browser-supplied JSON select a privileged process identity;
- run arbitrary Mission code/rules;
- change Mission product schema/rows except for read-only integration references;
- change DNS/custom domain;
- resume parked WO-0006;
- create a paid KMS key without explicit product-owner approval.

## 1. Production database boundary

Use the existing approved Cloud SQL instance:

- project: `pct-99`
- region: `us-central1`
- instance: `pct99-missions-prod`

Create a separate database:

`economy`

Do not place economic tables inside the `missions` database.

Apply the accepted economic migration path to `economy`.

Backups/PITR/deletion protection remain instance-level and must still be enabled.

Record exact migration names/checksums applied.

## 2. Database roles

Create distinct production identities.

Suggested logical roles:

### `economy_app_submitter`

Purpose: normal application/human-safe submission only.

Must not:

- INSERT authoritative commands;
- INSERT events;
- INSERT rule versions;
- INSERT reward keys;
- UPDATE/DELETE/TRUNCATE economic history;
- own schema/tables.

### `economy_recognition_submitter`

Purpose: submit recognition/correction intents only.

### `economy_governance_submitter`

Purpose: submit rule publication/activation intents only.

### `economy_bounty_recognition_submitter`

Purpose: submit bounty completion/satisfaction recognition only.

### `economy_kernel_writer`

Private worker only.

May append:

- authoritative command receipts;
- economic events;
- rule versions;
- reward keys;
- append-only intent outcomes.

Must not UPDATE/DELETE/TRUNCATE history or own schema.

### `economy_verifier`

Read-only.

No application role may inherit the kernel-writer role.

## 3. Capability-safe intent submission

Do not grant generic raw INSERT on command intents if that would let a submitter forge privileged process identity/command type.

Create a capability boundary that derives authority from the authenticated database/service identity.

Acceptable patterns include narrowly scoped SECURITY DEFINER submission functions or equivalent server-side capability functions.

Minimum submission capabilities:

### Human/application

May submit only human-safe commands.

For WO-0015 shadow mode, it is acceptable for no production product command to be wired yet.

The capability must not allow:

- `publish_rule`
- `activate_rule`
- `recognize_contribution`
- `adjust_mcu`
- `recognize_bounty_completion`

unless a later accepted role explicitly owns one.

### Recognition

May submit:

- `recognize_contribution`
- `adjust_mcu`

Process identity is derived/fixed as `recognition`.

### Governance

May submit:

- `publish_rule`
- `activate_rule`

Process identity is derived/fixed as `rule-publisher`.

### Bounty recognition

May submit:

- `recognize_bounty_completion`

Process identity is derived/fixed as `bounty-recognition`.

Capability SQL is an authorization boundary only. Do not duplicate reward math/business evaluation in SQL.

## 4. Intent provenance

Each intent must record enough immutable provenance to know which trusted channel submitted it.

At minimum:

- intent id;
- Mission id;
- command type;
- idempotency key;
- canonical payload;
- derived actor/process identity;
- submitter capability/source;
- submitted timestamp.

The submitter capability/source must not be client-overridable.

A shared web credential must not be able to write a row that appears to have come from the recognition/governance channel.

## 5. Append-only intent outcomes

Add an append-only operational/audit table such as:

`economic.intent_outcomes`

Minimum:

- intent id primary/unique ref;
- outcome: accepted/refused;
- authoritative command id nullable;
- refusal code nullable;
- processed timestamp;
- kernel worker version/build ref if useful.

No UPDATE/DELETE/TRUNCATE.

One intent gets at most one outcome.

A crash after economic commit but before outcome insert must recover by replaying the idempotent command and then appending the same outcome.

## 6. Private kernel worker

Create a dedicated executable/process such as:

`npm run economy:worker`

Responsibilities:

1. read pending intents;
2. use the recorded trusted capability/source;
3. reconstruct a canonical EconomicCommand;
4. re-run `assertCommand`;
5. ensure command type is allowed for that capability;
6. invoke `commitCommand` using the private kernel-writer connection;
7. append accepted/refused intent outcome;
8. safely retry serializable/deadlock/process-crash cases;
9. never call an external payment/ownership provider in the kernel transaction.

The worker must be safe with multiple concurrent instances.

Use `FOR UPDATE SKIP LOCKED`, unique outcomes/idempotency, or another proven approach.

Do not create a mutable leased/processing status as economic truth.

## 7. Worker identity isolation

Prepare a separate runtime identity/service boundary for the kernel worker.

App Hosting serving identity must not be able to read the kernel-writer secret.

The kernel worker identity may read only:

- economic kernel-writer DB secret;
- other strictly required economic secrets.

It must not receive broad Secret Manager access.

Do not download long-lived service-account JSON.

Use workload/default identity where platform supports it.

## 8. Secrets

Use Secret Manager for production DB passwords.

At minimum:

- application/human submitter credential if/when wired;
- recognition submitter credential;
- governance submitter credential;
- bounty-recognition submitter credential;
- kernel-writer credential;
- verifier credential if needed by deployed tooling.

The kernel-writer secret must not be exposed to App Hosting.

Do not put values in Git, reports, logs, screenshots, or PR comments.

## 9. No-value shadow mode

Production economic database starts with no real economic history.

WO-0015 may create:

- schema migration rows;
- role/grant metadata;
- append-only operator/config metadata if required.

Do not create:

- a fake real Mission MCU grant;
- a fake bounty reward;
- a production rule pretending to govern a real Mission;
- a test economic event in a real Mission stream.

End-to-end reward tests continue in disposable/staging PostgreSQL.

If a production smoke requires writing rows, use a separately identified non-product shadow/sandbox database rather than polluting the production `economy` event stream.

## 10. Economic production health

Add operator/read-only health tooling.

It should verify:

- DB reachable;
- migrations current;
- required tables/triggers present;
- production roles match expected grants;
- kernel writer cannot UPDATE/DELETE;
- application role cannot append authoritative rows;
- no invalid/broken event chain exists.

If exposing an HTTP health route, it must:

- be read-only;
- reveal no secrets/role names/internal identifiers unnecessarily;
- return only ready/unavailable;
- use verifier/read credentials, not kernel-writer credentials.

No public mutation route in this order.

## 11. Production export + verifier

Add operator tooling to export one Mission economic history from production using verifier/read-only authority.

Since production should have no real economic events yet, also prove the export/verifier workflow on a disposable/staging Mission with representative events.

The production tool itself must be ready before the first real grant.

## 12. Backup / restore drill

Prove recovery of the economic database before value exists.

Required:

- logical backup of a representative disposable/staging economic database;
- restore to a second database;
- verifier succeeds;
- event totals/rules/commands/reward keys/intents/outcomes match;
- role grants can be reapplied from source;
- migration history matches.

For production, verify Cloud SQL backups/PITR remain enabled.

Do not intentionally destroy production.

## 13. Checkpoint format

Implement a versioned checkpoint format independent of the database.

A checkpoint for a Mission should include at minimum:

- checkpoint format version;
- Mission id;
- last economic sequence;
- last event hash;
- event count;
- checkpoint timestamp;
- signer/key reference;
- signature.

The signed material must use one canonical encoding.

A checkpoint does not replace the event chain; it externally anchors its current root.

## 14. Signing abstraction

Implement a signer/verifier interface with a local deterministic/test signer in CI.

Production target is a non-exportable asymmetric key, expected to be Cloud KMS.

Add tests:

- valid checkpoint signature;
- changed sequence fails;
- changed event hash fails;
- changed Mission fails;
- wrong public key fails;
- reordered/corrupted economic history cannot match a valid checkpoint.

Do not create a paid KMS key unless explicit approval exists.

## 15. Cloud KMS deployment plan

Document the exact expected production design:

- project `pct-99`;
- region/location choice;
- asymmetric signing purpose/algorithm;
- non-exportable private key;
- public key retrievable for offline verification;
- worker/checkpoint service gets only signing permission;
- App Hosting gets no signing permission;
- audit logging retained.

Recheck current Google Cloud KMS requirements/pricing immediately before any future creation.

If product-owner approval is absent, stop at READY/BLOCKED for the KMS resource.

## 16. Public checkpoint publication design

Document where future checkpoint material will be published outside the mutable economic database.

Requirements:

- append-oriented/versioned location;
- independently retrievable;
- contains no private identity;
- verifier can combine export + public key + checkpoint.

WO-0015 does not need to publish a real production economic checkpoint if there are zero events and no approved signing key.

## 17. CI capability tests

In disposable PostgreSQL, prove:

- application submitter cannot submit recognition/governance/bounty-recognition commands;
- recognition submitter cannot publish/activate rules;
- governance submitter cannot recognize contribution/completion;
- bounty-recognition submitter cannot recognize Contribution or publish rules;
- no submitter can directly INSERT authoritative command/event/rule/reward rows;
- kernel writer can process allowed intents;
- browser-supplied actor strings cannot escalate channel authority;
- duplicate worker processing results in one command/outcome;
- crash/retry after commit yields one economic result + one outcome;
- multiple workers can process different intents safely.

## 18. CI regression

Existing economic tests remain green:

- race/idempotency;
- hash-chain tampering;
- rule-version stability;
- AI boundary;
- offline verifier;
- role separation.

Existing Workspace + Mission DB paths remain green.

Dependency-security remains green.

## 19. Production provisioning gate

Before changing production:

- both GitHub Actions jobs green;
- exact branch head reviewed;
- no unresolved security findings;
- production plan lists database/users/secrets/service identities;
- no new recurring paid resource is silently created.

Creating the `economy` database and roles on the already-approved Cloud SQL instance does not authorize new paid infrastructure beyond that instance.

Any new KMS paid resource remains separately approval-gated.

## 20. Production shadow provisioning

After code review gates:

1. create `economy` database;
2. apply economic migrations;
3. create capability submitter roles;
4. create kernel writer + verifier;
5. apply least-privilege grants/functions;
6. create/store secrets;
7. configure isolated worker identity/runtime;
8. verify App Hosting cannot access kernel-writer secret;
9. run no-value role/health checks;
10. verify production economic tables contain no real MCU/bounty events.

No product rollout is required unless read-only health/config code needs App Hosting changes.

If a rollout is needed, manual exact-commit promotion only; automatic rollouts stay off.

## 21. Production acceptance checks

Prove:

- Mission product remains healthy;
- current 99pct shell remains healthy;
- production economic DB migrations current;
- application role cannot mint;
- private worker identity is isolated;
- no real economic events exist;
- backups/PITR/deletion protection unchanged;
- export/verifier operator tooling can connect read-only;
- no DNS/custom-domain/predecessor/Workspace behavior changed.

## 22. Durable report

Create:

`docs/implementation-reports/WO-0015-economic-production-boundary.md`

Include:

- production database name;
- migration list/checksums;
- role/capability design;
- secret names without values;
- worker identity/service design;
- intent/outcome behavior;
- CI race/capability evidence;
- production provisioning evidence;
- backup/PITR state;
- checkpoint/signing design;
- KMS approval status;
- confirmation of zero real MCUs/bounties/economic events.

Do not include credentials, private identities, access tokens, private notes, or secret values.

## Acceptance

1. Production economic data is isolated from the Mission product database.
2. App Hosting/general application credentials cannot append authoritative economic truth.
3. Privileged process authority is derived from trusted capability channels, not client JSON.
4. Recognition/governance/bounty-recognition submitters cannot impersonate one another.
5. Private kernel writer is isolated from App Hosting.
6. Intent processing is idempotent and safe under concurrent workers/crash-retry.
7. Intent outcomes are append-only and unique.
8. Economic history remains append-only/hash-linked/verifiable.
9. Production roles/grants mechanically match the intended boundary.
10. Backup/restore/export/verifier paths are proven.
11. Checkpoint format/signature verifier exists and passes tamper tests.
12. KMS production design is documented; no paid KMS resource is created without approval.
13. Production contains zero real MCU grants and zero bounty rewards.
14. No money, ownership, DNS, predecessor, or Workspace behavior changes.

## Return

Open the PR with all evidence and stop.

Do not issue the first production MCU.
Do not implement real bounties.
Do not resume WO-0006.
