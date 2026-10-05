# WO-0016 — Contribution recognition + first MCU issuance

## Status

**BLOCKED — EXPLICIT CLOUD KMS SPEND APPROVAL REQUIRED**

Do not execute this work order until product-owner approval is recorded durably in the repository.

Approval of WO-0015, Cloud SQL, or the architecture is not approval of the KMS spend.

Before any KMS creation, recheck current Google Cloud KMS pricing and algorithm availability. If the expected configuration or cost changes materially, stop for renewed approval.

## Goal

Create the first end-to-end production path:

`confirmed helper → Contribution submitted → Contribution recognized → deterministic MCU grant → signed checkpoint`

This order may create the first real production MCU only after every gate below is satisfied.

It must preserve the three-ledger rule:

- MCU/contribution ledger;
- money ledger;
- legal ownership ledger.

An MCU grant is not money and is not legal equity.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/ECONOMIC_KERNEL.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-001, ADR-002, ADR-020, ADR-021, ADR-022
- WO-0014 and WO-0015 implementation reports
- current Mission participation model
- current economic capability/worker/checkpoint code

## Branch

`wo/0016-first-mcu`

## Hard boundaries

Do not:

- execute while the KMS gate is unsatisfied;
- give App Hosting the recognition, governance, kernel-writer, or KMS-signing credentials;
- let a browser/client pick process identity;
- let a recognizer choose an arbitrary MCU amount per Contribution;
- let Contribution submission mint value;
- treat MCUs as legal shares, transferable securities, or cash;
- add cash bounties;
- add legal-equity issuance;
- add arbitrary admin set-balance/grant tools;
- add mutable economic balances;
- bypass signed checkpointing for the first real grant;
- change DNS/custom domains;
- resume WO-0006.

## 1. Record spend approval before resource creation

The durable report must quote or cite the exact product-owner approval and date.

Expected planned KMS:

- project: `pct-99`
- location: `us-central1`
- key ring: `economy-checkpoints`
- key: `economy-ledger`
- purpose: `ASYMMETRIC_SIGN`
- algorithm: `EC_SIGN_ED25519`
- protection: software / non-exportable private key

Recheck official pricing and support immediately before creation.

## 2. Provision KMS signer

After approval:

1. enable Cloud KMS API if required;
2. create the key ring;
3. create one asymmetric signing key/version;
4. retrieve public key;
5. grant only the isolated checkpoint/kernel-worker service identity the minimum signing permission;
6. give App Hosting no signing permission;
7. confirm no private key material can be exported;
8. record resource names, not secret/private material.

Do not use HSM unless a later decision explicitly chooses its materially higher cost.

## 3. KMS signer implementation

Add a production `CheckpointSigner` implementation using Cloud KMS.

It must:

- sign the exact `economic-checkpoint-v1` canonical message;
- verify signatures with the retrieved public key;
- use raw-data semantics appropriate to `EC_SIGN_ED25519`;
- not expose private key material;
- fail closed on signer/key mismatch.

CI keeps the local signer and adds adapter tests with mocks/fixtures.

## 4. Durable checkpoint storage

Add append-only checkpoint persistence separate from authoritative economic events.

A checkpoint record contains:

- Mission id;
- last sequence;
- last event hash;
- event count;
- checkpoint timestamp;
- signer/key version reference;
- signature.

Checkpoint rows are append-only.

A checkpoint is not itself economic truth; it externally anchors the event-stream root.

The verifier must be able to verify:

`economic export + checkpoint + public key`

without kernel-writer credentials.

## 5. Contribution persistence in Mission product DB

Add an additive Mission migration.

### `contributions`

Suggested immutable fields:

- id UUID primary key;
- work id;
- participant human uid;
- submitted_by_uid;
- summary;
- evidence/reference text or structured public-safe reference;
- submitted_at;
- unique/idempotency key if needed.

Submission requires:

- verified human session;
- exact Work path;
- that human is already mutually confirmed as Helping on the Work;
- server-side identity binding.

Contribution is append-only.

No MCU amount field.

### `contribution_recognitions`

Suggested immutable fields:

- contribution id primary/unique ref;
- recognized_by_uid;
- rule id;
- rule version;
- recognized_at;
- optional public-safe evidence/reference;
- bridge idempotency key.

Only the Mission creator may recognize in this first slice.

Recognition is append-only and one-way in WO-0016.

Corrections/reversals remain later economic compensating events; do not silently mutate recognition.

## 6. Contribution submission UI/API

On a Work page, a confirmed helper may choose:

**Record a Contribution**

Fields should be minimal:

- what did you contribute?
- evidence/reference, optional or required as product decides from existing patterns

Copy:

> Recording a Contribution does not itself create MCUs. Recognition happens separately.

Signed-out/unconfirmed humans cannot submit.

The server derives contributor identity from the verified session; never accept uid from client JSON.

## 7. Creator recognition UI/API

Mission creator sees submitted Contributions for Work in their Mission.

Action:

**Recognize Contribution**

Before action, explain:

> Recognition makes this Contribution eligible for the Mission's active MCU rule. The rule—not this button—determines the MCU amount.

The creator cannot type an MCU amount.

Server must prove:

- creator owns Mission;
- Contribution belongs to that Mission/Project/Work;
- contributor was confirmed Helping;
- Contribution not already recognized;
- referenced rule/version is the configured allowed production rule.

## 8. First production MCU rule

Use only the existing constrained rule kind:

`fixed_mcu_on_recognition`

Do not add a general scripting/rule language.

The first production Mission/rule must be explicitly documented.

Prefer a designated 99pct alpha/test Mission or another clearly controlled Mission before enabling broad Mission-created rules.

Rule publication and activation must use the governance capability through an isolated operator/governance process.

No ordinary web endpoint gets governance credentials.

## 9. Recognition bridge

Implement an isolated bridge executable/process.

It reads unbridged `contribution_recognitions` from the Mission DB using a least-privilege read identity.

For each recognition it re-verifies:

- Mission/Work/Contribution linkage;
- recognizer is Mission creator;
- contributor identity;
- confirmed participation exists;
- no prior successful bridge outcome;
- exact rule id/version is allowed.

Then it submits one intent through the **recognition submitter** capability.

The bridge must not have kernel-writer authority.

Record an append-only Mission-side bridge outcome/reference:

- recognition id;
- economic intent id;
- submitted timestamp;
- final economic command/event refs when known.

Retries must resolve to the same economic intent/command.

## 10. Kernel worker

The existing isolated kernel worker processes the recognition intent.

It remains the only writer of authoritative economic events.

Expected event flow includes:

- `contribution_recognized`
- exactly one `mcu_granted`

Grant amount comes from the immutable rule version.

No app route may directly call `commitCommand` with the kernel writer.

## 11. Checkpoint after accepted economic command

After an accepted command changes a Mission economic stream:

1. read/verify the complete Mission economic history;
2. build checkpoint at the latest sequence/hash;
3. sign with Cloud KMS;
4. persist append-only signed checkpoint;
5. verify the stored signature with the public key.

External KMS signing remains post-commit.

If signing fails:

- do not roll back/rewrite economic history;
- mark the stream as **unanchored** in derived operational state;
- do not present the new MCU amount as fully released/anchored in the product;
- retry checkpointing safely.

No further real-value command for that Mission should be processed while the latest economic history is unanchored.

## 12. Read model / UI

Public or participant-safe MCU presentation may be introduced only from recorded economic data.

For the contributor show:

- recognized Contribution;
- granted MCU amount;
- rule/version;
- anchored/checkpointed state.

Do not display:

- legal ownership percentage;
- dollar value;
- transferability;
- cash balance.

Copy should state:

> MCUs record recognized Mission contribution. They are not legal shares or cash.

Public history may remain limited in this slice if privacy/public identity design is not ready.

## 13. Privacy

Economic events use public/pseudonymous contributor refs, not Firebase uid/email.

Add an explicit mapping boundary from Mission human identity to economic contributor ref.

Public/export data must not contain:

- verified email;
- Firebase uid;
- private notes;
- auth/session data.

## 14. Authorization negative tests

Prove:

- signed-out cannot submit Contribution;
- non-participant cannot submit;
- participant cannot submit as another human;
- non-creator cannot recognize;
- creator cannot recognize Contribution from another Mission;
- creator cannot choose amount;
- web application cannot use recognition/governance/kernel credentials;
- recognition bridge refuses invalid/unconfirmed data;
- duplicate recognition/bridge retries do not double-grant.

## 15. KMS/checkpoint tests

Prove:

- App Hosting service identity cannot sign;
- signing identity can sign only the planned key;
- valid KMS signature verifies;
- altered checkpoint fields fail;
- altered economic history fails checkpoint match;
- stale checkpoint is detectable;
- latest unanchored economic state blocks subsequent real-value processing;
- retrying a failed checkpoint does not change economic events.

## 16. PostgreSQL / race tests

Disposable CI must prove:

- duplicate Contribution submission behavior;
- duplicate creator recognition behavior;
- two recognition bridge workers race → one intent;
- two kernel workers race → one grant;
- checkpoint worker retries → one logical checkpoint for a given root;
- later rule versions do not reinterpret the first grant.

Existing Workspace, Mission, and economic kernel tests stay green.

## 17. Production migration order

Before production product migration:

- local gates green;
- both GitHub Actions jobs green;
- exact branch commit reviewed;
- KMS approval recorded;
- KMS key provisioned/tested;
- current Mission health ready;
- economic shadow ledger still empty.

Apply additive Mission Contribution migration first.

The existing app build must remain healthy if the migration is additive.

Apply any additive economic checkpoint migration separately to `economy`.

Verify role grants after each migration.

## 18. Production rollout

Manual exact-commit App Hosting rollout only.

Automatic rollouts remain off.

Do not put recognition/governance/kernel/KMS credentials into App Hosting.

App Hosting may receive only the least capability needed for human Contribution submission, if necessary.

Isolated bridge/worker identities run separately.

## 19. First real-value canary

Use one deliberately selected controlled Mission/Work/confirmed helper.

Before recognition:

- verify rule publication/activation exists;
- verify latest economic history is checkpointed;
- verify contributor ref mapping;
- verify all health/role checks.

Then prove end to end:

1. helper records Contribution;
2. Mission creator recognizes it;
3. recognition bridge creates one recognition intent;
4. kernel worker emits one `contribution_recognized` + one `mcu_granted`;
5. amount equals immutable rule;
6. KMS signs the new root;
7. checkpoint verifies;
8. contributor UI shows anchored MCU grant;
9. export + verifier + checkpoint all agree;
10. retrying any step does not create another grant.

Keep the first real economic history. Do not delete it to clean up.

## 20. Operational safety

After first grant verify:

- Mission health ready;
- economic health ready;
- latest economic root checkpointed;
- KMS audit evidence exists;
- backups/PITR/deletion protection remain on;
- App Hosting still lacks privileged economic secrets;
- no money/ownership behavior exists;
- automatic rollouts off.

## 21. Rollback

Application rollback must not reverse economic history.

If the app release fails, restore previous app build.

Contribution/recognition/economic migrations remain additive.

The first MCU event and checkpoint remain immutable.

Use compensating economic events only if a later accepted correction workflow requires them.

## 22. Durable report

Create:

`docs/implementation-reports/WO-0016-first-mcu.md`

Include:

- exact product-owner KMS approval;
- KMS configuration and current pricing checked;
- Mission/economic migration list;
- Contribution/recognition authorization;
- recognition bridge identity;
- governance/rule configuration;
- first canary Mission/Work refs without private email;
- economic command/event ids;
- MCU amount/rule/version;
- checkpoint sequence/hash/key version/signature verification result;
- CI runs;
- deployed build;
- backup/PITR state;
- explicit confirmation no cash/equity/bounty reward was created.

Never include private keys, passwords, cookies, access tokens, private emails, or verification links.

## Acceptance

1. KMS approval is explicit and recorded before creation.
2. Non-exportable production signing key exists with least-privilege IAM.
3. App Hosting cannot sign and cannot access recognition/governance/kernel secrets.
4. Confirmed helper can submit immutable Contribution.
5. Submission alone creates no MCU.
6. Only authorized Mission creator can record recognition in the first slice.
7. Creator cannot choose MCU amount.
8. Isolated recognition bridge alone can submit recognition capability intent.
9. Kernel deterministically creates exactly one grant.
10. Grant references exact immutable rule/version and Contribution.
11. KMS-signed checkpoint anchors the resulting history.
12. Unanchored history cannot be presented as fully released and blocks subsequent value processing.
13. Export + offline verifier + checkpoint agree.
14. Retry/race paths cannot double-grant.
15. MCU UI does not imply money or legal ownership.
16. Production health/backups/PITR remain healthy.
17. No cash bounty, money movement, legal equity, DNS, predecessor, or Workspace change occurs.

## Return

Open the PR with all evidence and stop.

Do not build cash bounties.
Do not implement legal ownership.
Do not resume WO-0006.
