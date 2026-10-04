# Economic Kernel

Updated: 2026-10-04

## Purpose

The economic kernel is the smallest trusted subsystem behind future:

- Contribution recognition;
- MCU issuance and correction;
- bounty rewards;
- automated Mission incentives;
- money-provider requests/reconciliation;
- legal-ownership connector references.

It is deliberately narrower than the 99pct application.

The goal is not literal impossibility of failure. The goal is that common software failure modes cannot silently corrupt economic truth.

## Core model

```text
Command
  ↓
Authorization + canonicalization + idempotency
  ↓
Deterministic rule/state transition
  ↓
Atomic append-only event batch
  ↓
Derived state / projections
  ↓
Optional idempotent external effects
```

### Commands

Commands request economic transitions.

A command contains at least:

- Mission scope;
- command type;
- actor/process reference;
- canonical payload;
- idempotency key;
- subject/evidence references.

Commands are not economic truth. Accepted events are.

The same idempotency key + same canonical content returns the same receipt/result.

The same idempotency key + different content is a hard conflict.

### Events

Events are immutable facts.

Minimum envelope:

- event id;
- Mission id;
- per-Mission sequence;
- event type;
- command id;
- actor/process reference;
- subject reference;
- rule id/version when relevant;
- canonical payload hash;
- prior event hash;
- event hash;
- recorded timestamp.

Per-Mission sequence is monotonic.

Update/delete is forbidden through runtime roles and defended by database triggers.

### Rules

A rule version is immutable once published.

Activation/deactivation/freeze is recorded through events rather than editing the old rule.

Every economic outcome records the exact rule version that produced it.

Initial rules are declarative and constrained. Do not run arbitrary Mission-provided code inside the kernel.

### Quantities

MCUs use a fixed integer smallest unit.

Recommended representation:

- code/runtime type: bigint;
- wire/export representation: decimal string;
- no JavaScript Number for authoritative MCU amounts.

The display scale can evolve independently from the stored integer unit, but a rule version records the scale/units it uses.

## Event-chain tamper evidence

Each Mission has an independently verifiable event chain.

Conceptually:

```text
event_hash =
  SHA-256(
    format_version
    + mission_id
    + sequence
    + event_id
    + event_type
    + command_id
    + actor_ref
    + subject_ref
    + rule_ref
    + payload_hash
    + previous_event_hash
  )
```

The exact canonical encoding must be versioned and shared by writer + verifier.

The verifier must detect:

- deleted events;
- reordered events;
- inserted events;
- payload mutation;
- broken prior-hash links;
- duplicate sequences;
- invalid command/rule references where those references are part of the export.

Hash chaining alone does not prove an attacker with full database control did not rewrite the entire chain. Later hardening adds externally signed/published checkpoints.

## Derived state

Derived state is disposable.

Examples:

- contributor MCU total;
- MCU total by rule;
- bounty lifecycle state;
- reward-issued state.

A projection may be cached for performance, but:

- it is not source of truth;
- no business path directly edits it;
- it can be rebuilt from events;
- tests compare rebuild vs current projection.

## Corrections

Never edit/delete the original event.

A correction is a new event that:

- references the original event;
- records reason/authority/rule as required;
- applies a compensating signed quantity or specific reversal semantic.

History must continue to show both the original and correction.

## Autonomous execution

Autonomous does not mean unconstrained.

The economic engine may automatically append events only when deterministic prerequisites are already recorded.

Example:

```text
BOUNTY_TERMS_PUBLISHED
+ PARTICIPATION_CONFIRMED
+ COMPLETION_RECOGNIZED
+ exact active reward rule
→ one BOUNTY_REWARD_GRANTED event
```

If the worker crashes after commit, replay sees the idempotency/reward key and does not double-grant.

If two workers race, database uniqueness/serialization allows one logical grant.

## Bounties

A bounty is a conditional reward contract layered on Work.

Important separate facts:

1. terms published;
2. terms accepted/eligible;
3. work/evidence submitted;
4. satisfaction/completion recognized;
5. reward granted;
6. external payout requested/settled when money exists.

A bounty must have a stable reward key.

An MCU bounty may grant MCUs only after its required recognition fact exists.

A money bounty is not “funded” merely because a number is written in the database. Funding must reference appropriate external financial infrastructure.

## External effects

No external provider call belongs in the economic decision transaction.

Pattern:

```text
economic event committed
→ outbox/effect request
→ idempotent connector call
→ provider result event
```

Examples:

- money payout;
- escrow/funding confirmation;
- legal equity settlement request;
- notification.

Provider callbacks/webhooks are treated as untrusted duplicated input until verified and made idempotent.

## AI

AI is outside the trusted economic decision boundary.

Allowed:

- draft bounty terms;
- summarize evidence;
- classify evidence into a proposed command;
- suggest a rule change;
- explain ledger history.

Not allowed:

- direct MCU mint;
- direct payout;
- direct legal-ownership change;
- bypass deterministic recognition/rule checks.

## Database boundary

Initial target:

- isolated `economic` PostgreSQL schema in disposable CI;
- separate migration path from Mission product migrations;
- economic event/rule tables owned by migration/admin role;
- runtime has only the least privilege necessary;
- runtime cannot UPDATE/DELETE event/rule history;
- database constraints/triggers provide a second line of defense.

Do not apply the economic schema to production in WO-0014.

## Reference state machines

### Contribution / MCU

```text
submitted
→ recognized
→ MCU grant (deterministic rule)
→ optional compensating adjustment later
```

Submission alone never grants.

### Bounty

```text
published
→ eligible/participating
→ completion submitted
→ completion recognized
→ reward granted exactly once
```

The precise product states may evolve. The kernel invariant does not: reward is the consequence of recorded terms + recorded satisfaction under an exact rule version.

## Threat model

WO-0014 must test against:

- duplicate HTTP/queue commands;
- concurrent duplicate commands;
- concurrent different commands;
- process crash/retry;
- stale worker replay;
- idempotency-key collision with different content;
- event update/delete attempts;
- rule update/delete attempts;
- old rule vs new rule replay;
- invalid state transition;
- duplicate bounty reward;
- integer overflow/range violations;
- projection drift;
- export tampering;
- export reordering;
- event deletion;
- unauthorized actor;
- unknown rule;
- invalid hash chain.

## Later hardening

After basic kernel acceptance:

- Cloud KMS-backed checkpoint signing;
- periodic public checkpoint publication/transparency log;
- independent verifier package/binary;
- disaster-recovery rebuild from export;
- multi-approver governance for sensitive rule activation;
- time-delayed rule activation;
- Mission economy freeze/unfreeze events;
- external money connector reconciliation;
- legal-ownership connector reconciliation.

These layers must not change historical event semantics.
