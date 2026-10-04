# Security invariants

Updated: 2026-10-04

These rules bind implementation. Do not weaken them without an accepted Architecture Decision Record in `DECISIONS.md`.

Existing product security is partially enforced by tests. Economic-kernel invariants below must be mechanically enforced before production MCU/bounty behavior is allowed.

## Application invariants

### SEC-001
No ordinary password or session credential alone may transfer legal ownership.

### SEC-002
MCU history is append-only. Corrections occur through new compensating events rather than destructive history edits.

### SEC-003
Deleting or disabling a 99pct account cannot itself destroy legally issued ownership.

### SEC-004
Raw Social Security numbers must not be stored in the normal 99pct application database.

### SEC-005
No application administrator may have an unrestricted "set ownership percentage" capability.

### SEC-006
Every MCU event must ultimately be attributable to a Mission, contributor, governing rule and version, evidence or reason, timestamp, and the actor or process that authorized it.

### SEC-007
The UI may describe legal equity as issued only when an authoritative legal issuance or reference exists.

### SEC-008
The UI must not imply that MCUs are freely transferable securities.

### SEC-009
Mission contribution records must eventually be exportable and independently verifiable.

### SEC-010
Authorization for protected actions must be enforced server-side, not only through UI visibility.

### SEC-011
99pct must not represent money it custodies as an editable application balance. Money movement must reference appropriate external financial infrastructure.

## Ownership safety invariants

| ID | Rule | Related SEC rules |
|---|---|---|
| OWN-001 | Ownership is a registered legal relation, not a bearer token. | SEC-001, SEC-008 |
| OWN-002 | No seed phrase controls a person's equity. | SEC-001 |
| OWN-003 | No single credential can transfer ownership. | SEC-001 |
| OWN-004 | No single administrator can alter ownership. | SEC-005 |
| OWN-005 | Nothing is silently deleted. Corrections are new events. | SEC-002 |
| OWN-006 | MCU history is cryptographically tamper-evident. | SEC-009 |
| OWN-007 | Actual ownership exists independently of 99pct. | SEC-003, SEC-007 |
| OWN-008 | Money is held by appropriate external financial infrastructure, not the application database. | SEC-011 |
| OWN-009 | Private identity information never goes on a public ledger. | SEC-004 |
| OWN-010 | Every Mission can export and independently verify its complete history. | SEC-009 |
| OWN-011 | Vested contributor ownership cannot be confiscated merely for leaving the Mission. | SEC-003 |
| OWN-012 | If 99pct disappears, the humans still own their companies. | SEC-003, SEC-007 |

OWN-011 is a requirement for corporate documents and equity agreements, not a feature flag in application terms of service.

## Test expectation

Security-sensitive work orders include negative tests: an authorized actor succeeds and an unauthorized actor receives a server-side refusal. UI hiding is not the test.


## Economic-kernel invariants

### ECO-001 — Event history is authoritative
MCU totals, bounty state, and other economic projections are derived from append-only economic events. A mutable balance/status field must never be the source of truth.

### ECO-002 — No destructive correction
Economic events may not be updated or deleted through the application runtime. Corrections use compensating events that reference the original event.

### ECO-003 — Idempotent commands
Every economic command carries an idempotency key scoped to its Mission. Replaying the same command must not create a second economic outcome. Reusing the same key for different canonical command content must fail.

### ECO-004 — Exactly-once reward key
Every grant/reward has a stable uniqueness key. Concurrent workers, retries, webhook duplication, or job replay may not create a duplicate grant for the same logical reward.

### ECO-005 — Immutable rule versions
A published economic rule version cannot be edited. A new behavior requires a new version and explicit activation event.

### ECO-006 — Outcome provenance
Every MCU grant/adjustment must reference Mission, contributor/beneficiary, exact rule id/version, originating command, evidence/subject reference, authorizing actor/process, timestamp/sequence, and event hash.

### ECO-007 — No retroactive reinterpretation
Changing an active rule never changes the meaning or amount of a prior economic event. Historical state is reproducible under the rule version recorded at the time.

### ECO-008 — Deterministic core
The economic decision function may not depend on network calls, current external mutable state, nondeterministic random values, floating-point arithmetic, or an LLM response.

### ECO-009 — AI cannot directly grant
AI output can propose classifications, evidence, or commands, but no model response directly creates an MCU, money payout, or legal-ownership event.

### ECO-010 — Integer economic units
MCU arithmetic uses an integer smallest unit with an explicit fixed scale. JavaScript floating-point values are not accepted as authoritative MCU quantities.

### ECO-011 — External effects after commit
Money/legal/external-provider effects occur through idempotent post-commit connectors/outbox processing. Provider failure cannot roll back or mutate the economic decision history.

### ECO-012 — Money remains external
Internal economic events may reference external money intents/settlements, but 99pct does not create an editable custodial cash balance.

### ECO-013 — No ordinary admin mint
No application administrator receives a generic endpoint/UI/SQL capability to set an MCU balance, inject a grant, rewrite bounty completion, or mark a reward paid outside valid command/rule paths.

### ECO-014 — Tamper evidence
Per-Mission economic history must contain deterministic sequence and hash-link information so deletion, insertion, reordering, or payload mutation is detectable by an independent verifier.

### ECO-015 — Export + rebuild
A Mission's economic history and referenced rule definitions can be exported in a canonical format. A clean implementation can verify the history and rebuild its derived MCU/bounty state from that export.

### ECO-016 — Private identity stays private
Public economic exports may use stable public/pseudonymous subject references but must not contain verified email, Firebase uid, raw government identifiers, session data, secrets, or private notes.

### ECO-017 — Race safety is tested
Critical economic transitions require concurrent PostgreSQL tests demonstrating duplicate/replay/race resistance, not only sequential unit tests.

### ECO-018 — Fail closed
Unknown rule type/version, invalid history prefix/hash, mismatched idempotency content, overflow/out-of-range quantity, unauthorized actor, or invalid state transition must refuse the command without partial economic events.

### ECO-019 — Projections are disposable
Any cached/materialized projection must be deletable and rebuildable from authoritative events. Projection drift must be detectable.

### ECO-020 — Bounty reward requires satisfaction fact
Publishing or claiming a bounty does not itself grant reward. Reward automation requires an explicit recorded satisfaction/recognition fact that meets the immutable bounty terms/rule.

## Economic threat model

The kernel is designed to withstand normal software failure modes: retries, duplicated queues/webhooks, concurrency, stale workers, partial process crashes, ordinary admin/UI mistakes, prohibited row edits, and post-hoc tampering with stored history.

It does not claim to remain trustworthy after simultaneous compromise of the application, database-owner credentials, cloud control plane, and every future signing/checkpoint authority. High-assurance checkpointing and independent publication are separate hardening layers.
