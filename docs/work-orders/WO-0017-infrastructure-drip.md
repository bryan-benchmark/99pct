# WO-0017 — Infrastructure Drip

## Goal

Extend the accepted production economic kernel so one eligible primary human MCU grant can atomically create deterministic, additional infrastructure allocations under an immutable/versioned policy.

The human grant must remain unchanged.

For the initial production policy:

```text
human grant:               1.000000 MCU
infrastructure allocation: 0.010000 MCU
```

The allocation targets a real 99pct Infrastructure Mission.

It is mission-level accounting, not a human grant and not a transferable treasury token.

WO-0017 implements no cash collection and no general bounty flow.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- `docs/ECONOMIC_KERNEL.md`
- `docs/INFRASTRUCTURE_DRIP.md`
- `docs/SECURITY_INVARIANTS.md`
- ADR-001, ADR-002, ADR-020 through ADR-024
- WO-0016 implementation report
- current economic rule/event/checkpoint/export/verifier code

## Branch

`wo/0017-infrastructure-drip`

## Hard boundaries

Do not:

- reduce a contributor's rule-defined MCU grant;
- retroactively apply the drip to the accepted WO-0016 grant;
- represent a dependency Mission as a fake human contributor;
- add MCU transfer/spend/withdrawal;
- convert MCUs to dollars or legal ownership;
- move money;
- implement the hosted cash fee;
- implement general bounties;
- let infrastructure allocations recursively trigger more allocations;
- let an admin edit a policy/rate/dependency allocation in place;
- let a browser choose governance/process identity;
- change DNS/custom domain;
- resume WO-0006.

## 1. Create/designate the 99pct Infrastructure Mission

Use the normal Mission product path.

Create or designate one public forming Mission whose purpose is the shared infrastructure that downstream 99pct Missions depend on.

Recommended public name:

**99pct Infrastructure**

Its Mission id becomes the first dependency Mission ref.

Do not create:

- legal entity;
- legal equity;
- cash treasury;
- special hidden admin ownership.

Record its public Mission id/slug in the implementation report.

## 2. Add Infrastructure Drip policy model

Add an immutable/versioned policy model separate from the existing fixed human-recognition rule semantic.

Suggested identity:

- policy id: `infrastructure-drip`
- version: positive integer
- rateBps
- dependencies[]
- definitionHash
- published event/sequence
- activation metadata

Each dependency:

- `missionRef`
- `weightBps`

Constraints:

- rateBps integer;
- `0 <= rateBps <= 200`;
- production v1 rate = 100;
- weights positive integers;
- weights sum exactly to 10,000 when rate > 0;
- duplicate Mission refs invalid;
- max 16 dependencies;
- canonical ordering before hashing.

If rate = 0, require an explicit empty/no-allocation policy shape rather than ambiguous dependencies.

## 3. Preserve existing rule history

The existing `fixed-recognition` v1 publication/activation and WO-0016 events are immutable.

Do not rewrite old event payloads, hashes, command receipts, rule rows, or checkpoint history.

Any schema/parser change must continue to replay and verify sequences 1–4 exactly.

Add a fixture/regression using the accepted WO-0016 event shapes.

## 4. New command/event semantics

Add explicit kernel semantics for infrastructure policy publication/activation.

Prefer dedicated command/event types rather than overloading human rule semantics if that keeps validation clearer.

At minimum, economic history must contain immutable facts equivalent to:

- infrastructure policy published
- infrastructure policy activated
- infrastructure MCU allocated

Every allocation event must reference:

- source primary-grant event id;
- source Contribution ref if present;
- dependency Mission ref;
- amount;
- policy id/version;
- stable allocation key.

Do not call the event `mcu_granted` to a Mission.

## 5. Human grant + allocation atomicity

When an eligible `recognize_contribution` command succeeds:

1. append `contribution_recognized`;
2. append normal human `mcu_granted`;
3. derive the active Infrastructure Drip policy;
4. append zero or more `infrastructure_mcu_allocated` events.

All events come from the **same command transaction**.

If any allocation is invalid, the entire economic command fails with no partial human grant.

The human grant amount comes only from the primary recognition rule.

The drip policy cannot change it.

## 6. Deterministic rate math

Use integer minor units only.

```text
drip_total = floor(primary_amount * rate_bps / 10_000)
```

Protect multiplication/range/overflow.

A zero result creates no allocation event and still leaves the human grant valid.

Add edge tests around:

- 0 bps;
- 1 bps;
- 100 bps;
- 200 bps;
- 201 bps rejected;
- small primary amounts rounding to zero;
- max safe primary amount.

## 7. Deterministic dependency split

Implement deterministic largest-remainder allocation.

Required:

- floor each dependency share;
- remaining minor units assigned by descending remainder;
- canonical Mission ref tie-breaker;
- final sum exactly equals `drip_total`.

Tests:

- 100% single dependency;
- 50/50 even;
- uneven 40/25/20/10/5;
- tie remainders;
- different input ordering yields identical canonical output;
- duplicate Mission ref rejected;
- weights not equal to 10,000 rejected;
- more than 16 dependencies rejected.

## 8. Stable allocation key

Every logical infrastructure allocation gets a stable uniqueness key.

Recommended ingredients:

`source Mission + source primary grant event + policy id/version + dependency Mission`

Database uniqueness must protect it.

Retries/races may not append a duplicate allocation.

Do not rely only on an application lookup.

## 9. No recursive drip

Kernel state must distinguish:

- human grant;
- infrastructure allocation;
- adjustment;
- future bounty grant.

In WO-0017 only normal human `mcu_granted` created by Contribution recognition is eligible as the base.

An `infrastructure_mcu_allocated` event never triggers another allocation.

Add a regression specifically proving no:

`1% → 1% of 1% → ...`

chain can occur.

## 10. Derived views

Preserve:

`mcuTotal(events, humanBeneficiaryRef)`

It must count only human MCU grants/adjustments and remain unchanged by infrastructure allocations.

Add separate read models such as:

- infrastructure allocation total by dependency Mission;
- allocation history by source Mission;
- allocation history by source grant.

Do not call the Mission allocation projection a spendable balance.

## 11. Export and verifier

Extend canonical export/offline verification for the new policy and allocation events.

Verifier must prove:

- policy definition hash;
- publication binding;
- activation;
- rate <= protocol max;
- weights valid/sum;
- allocation math correct from source grant;
- allocation sum equals drip total;
- dependency refs match policy;
- stable allocation keys unique;
- no allocation refers to a missing/non-human primary grant;
- no retroactive allocation is injected against a historical grant from before policy activation.

Tamper tests:

- change rate;
- change dependency;
- change amount;
- delete one allocation;
- duplicate allocation;
- alter source grant ref;
- alter policy version;
- reorder allocation events;
- change dependency weight and rehash only rule row.

All must fail.

## 12. Checkpoint integration

Infrastructure policy publication, activation, and allocations are ordinary economic events in the source Mission stream.

They are covered by the same KMS checkpoint root.

Do not invent a second signing system.

After production allocation:

- export verifies;
- checkpoint verifies with pinned key;
- checkpoint matches the latest source Mission sequence/hash.

Mission-side read models must not present the new allocation as anchored until that latest checkpoint verifies.

## 13. Policy activation delay

### Bootstrap v1

The initial production Infrastructure Drip v1 may activate only after its publication is covered by a valid KMS checkpoint.

### Replacement v2+

A replacement policy version must have a minimum **24-hour production activation delay**.

Mechanically enforce it.

The trusted activation time must derive from server/database/process authority—not browser JSON.

Recommended shape:

- immutable publication records `notBefore`;
- governance capability derives or validates timing server-side;
- activation before `notBefore` fails closed;
- publication remains visible/exportable/checkpointed during the delay.

CI may inject time/test clocks.

Do not wait 24 real hours in CI.

## 14. Governance capability

Only governance authority may publish/activate Infrastructure Drip policies.

App Hosting must not receive governance credentials.

The first production v1 may be published by the same isolated governance/operator path used for WO-0016 rule publication.

No creator-specific web UI for changing the drip in WO-0017.

Later Mission governance can replace this bootstrap authority.

## 15. Recipient Mission validation

Before production policy publication, operator/governance tooling must verify each dependency Mission ref exists in the Mission product database and is public/valid for the intended allocation.

The kernel remains deterministic and does not network/query the Mission DB during economic evaluation.

The validated refs become immutable policy content.

Do not make cross-database reads inside the economic transaction.

## 16. Cash rail contract — no money movement

Create/update durable documentation for the future cash rail.

Freeze these boundaries:

- cash costs use money rail only;
- hosted fee is not MCU issuance/conversion;
- self-hosted open-source tree owes no hosted fee merely for running the code;
- current hard cash rate maximum: 100 bps;
- illustrative target range: 25–100 bps;
- future rate should be cost-targeting and may fall with scale;
- advertised MCU rewards are not silently reduced by the cash fee.

Do not:

- create a money ledger;
- add Stripe/payment provider;
- charge a customer;
- add cash balance fields.

## 17. Public/product copy

Where the accepted canary grant is shown after this release, preserve:

> MCUs record recognized Mission contribution. They are not legal shares or cash.

For a new drip-enabled anchored grant, add compact transparency copy showing:

- human grant amount;
- additional infrastructure allocation amount;
- dependency Mission;
- policy version;
- explicit statement that allocation was **not deducted** from the human grant.

Do not expose private email/uid/evidence that is not already public.

## 18. Security invariants

Extend `docs/SECURITY_INVARIANTS.md` with infrastructure-allocation invariants.

At minimum:

- human grant amount cannot be reduced by drip policy;
- policy above protocol max fails;
- dependency split must conserve drip total exactly;
- allocation cannot recursively drip;
- allocation cannot be transferred/spent;
- only governance can publish/activate;
- allocation is checkpoint/export verifiable;
- future cash fee cannot be represented as MCU subtraction.

## 19. CI / race tests

Add real PostgreSQL tests proving:

- recognition retry → one human grant + one allocation per dependency;
- two workers racing same recognition → one human grant + one allocation set;
- allocation key DB uniqueness;
- multiple simultaneous distinct recognitions preserve valid sequence/hash chain;
- human total excludes infrastructure allocations;
- dependency aggregate includes them;
- v2 publication does not alter v1 allocations;
- early v2 activation fails;
- old v1 grant/WO-0016 export still verifies.

All existing Mission/economic/checkpoint tests remain green.

## 20. Production migration safety

Any economic schema change must be additive with the live app/worker rollback assumptions.

Before production migration:

- exact branch green;
- current Mission health ready;
- current economic health ready;
- latest sequence-4 checkpoint verifies;
- backups/PITR/deletion protection on;
- existing WO-0016 export archived/verified.

Apply explicit migrations.

Re-run role/grant checks.

Do not change Mission product tables unless the Infrastructure Mission creation uses the normal product path.

## 21. Production v1 policy

After review gates, publish:

- policy id: `infrastructure-drip`
- version: 1
- rate: 100 bps
- dependency: 99pct Infrastructure Mission
- weight: 10,000 bps

Checkpoint the publication.

Then activate v1 through governance.

Checkpoint activation.

The existing WO-0016 1.000000 MCU grant remains unchanged and gets **no retroactive allocation**.

## 22. Production canary

Use a fresh Contribution after policy v1 is active.

Prefer the existing controlled canary Mission/Work/helper unless a fresh Work record makes the evidence clearer.

Expected primary recognition under `fixed-recognition` v1:

- human: +1.000000 MCU
- infrastructure: +0.010000 MCU allocation

Prove:

- human receives exactly 1.000000 MCU;
- allocation is exactly 10,000 minor units;
- allocation targets 99pct Infrastructure Mission;
- human cumulative MCU total increases only by 1.000000 for this grant;
- infrastructure allocation projection increases by 0.010000;
- no recursive allocation;
- no cash event;
- latest checkpoint verifies;
- retry adds nothing.

## 23. Rollout

Manual exact-green-commit App Hosting rollout only if UI/read-model changes require it.

Automatic rollouts remain off.

Do not add governance/kernel/KMS secrets to App Hosting.

Record new build and rollback target.

## 24. Durable report

Create:

`docs/implementation-reports/WO-0017-infrastructure-drip.md`

Include:

- 99pct Infrastructure Mission id/slug;
- policy definition/hash/version;
- protocol max;
- publication/activation event ids;
- checkpoint evidence;
- canary human grant id/amount;
- infrastructure allocation event id/amount/dependency;
- allocation math;
- human total proof;
- retry/race proof;
- CI;
- production migration/build;
- confirmation no cash/bounty/equity/DNS behavior was added.

Do not include private identity or credentials.

## Acceptance

1. Existing WO-0016 history verifies unchanged.
2. Contributor receives the full primary rule amount.
3. Infrastructure allocation is additional.
4. Infrastructure allocation uses a distinct mission-level event, not fake human `mcu_granted`.
5. Initial v1 policy is 100 bps and protocol max is 200 bps.
6. Dependency weights deterministically conserve the full drip total.
7. Infrastructure allocation does not recursively drip.
8. Human MCU totals exclude infrastructure allocations.
9. Allocation projection is independently derivable.
10. Policy versions are immutable.
11. Replacement versions enforce the 24-hour activation delay.
12. Policy/allocation events are exportable, hash-linked, and KMS-checkpointed.
13. Retry/races cannot duplicate human or infrastructure issuance.
14. No transfer/spend endpoint exists.
15. No cash movement or cash ledger is added.
16. Self-hosting remains free of hosted-network fee by software design.
17. Production canary proves +1.000000 human MCU and +0.010000 infrastructure allocation.
18. No bounty, legal equity, DNS, predecessor, or Workspace behavior changes.

## Return

Open the PR with all evidence and stop.

Do not start general bounties.
Do not implement cash settlement.
Do not resume WO-0006.
