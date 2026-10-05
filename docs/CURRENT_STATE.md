# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Mission → Project → Work → participation accepted through WO-0012
- 99pct public shell accepted in WO-0013
- Economic kernel foundation accepted in WO-0014 at `208f2be`
- Production economic shadow boundary accepted in WO-0015 at `2a3e13c`
- First production Contribution → MCU lifecycle accepted in WO-0016 at `bf7697a`
- Infrastructure Drip direction accepted in ADR-023
- Application source license: `AGPL-3.0-only`

## Product identity

**99pct is the product/network/Mission. Missionism is the protocol underneath it.**

99pct is being built as shared infrastructure for human commerce with Use / Operate / Build modes and future Utility Missions.

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live application:

- deployed code commit: `e477143abdd4a085f91193b8c4d4a8a76e68eab1`
- App Hosting build: `build-2026-10-05-001`
- traffic: 100%
- automatic rollouts: off
- rollback application: `build-2026-10-04-015`
- App Hosting secret binding remains `mission-db-password` only
- Mission health: ready

The report-only WO-0016 head was not rolled out.

## Production Mission product state

Cloud SQL instance:

- project: `pct-99`
- region: `us-central1`
- instance: `pct99-missions-prod`

Mission product database:

`missions`

The live product loop now reaches:

`Mission → Project → Work → Helping → Contribution → Recognition → anchored MCU grant`

Contribution submission is append-only and bound to the verified helper identity.

Contribution recognition is separate and creator-authorized in the current slice.

## Production economic state

Economic database:

`economy`

It remains separate from `missions`.

The canary Mission `wo-0009-test-mission` has immutable economic history through sequence 4:

1. rule `fixed-recognition` v1 published
2. rule `fixed-recognition` v1 activated
3. one Contribution recognized
4. one MCU grant

The accepted first real grant is:

- event: `d3bb975d-bdde-4f9a-b788-5d836b6b343f`
- amount: `1000000` minor units = **1.000000 MCU**
- rule: `fixed-recognition` version 1
- contributor receives the full rule-defined amount

Latest economic checkpoint:

- sequence: 4
- event count: 4
- hash: `23b698e0edce5455acb1a6f6c21c4fcb21b803348f3d2e70635953df365e3c99`
- signer: KMS key version 1
- export + checkpoint + pinned public key verify

Retries of Contribution, recognition, bridge, and kernel processing did not duplicate the grant.

## KMS signing

Production checkpoint key:

`projects/pct-99/locations/us-central1/keyRings/economy-checkpoints/cryptoKeys/economy-ledger/cryptoKeyVersions/1`

- algorithm: `EC_SIGN_ED25519`
- protection: software / non-exportable private key
- key-level signer binding: `economy-kernel-worker@pct-99.iam.gserviceaccount.com`
- App Hosting is not a signer
- project-owner signing remains documented break-glass administration

## Economic authority boundary

- web application records human/product facts;
- recognition/governance/bounty-recognition use isolated capabilities;
- private kernel writer is the only normal runtime writer of authoritative economic truth;
- App Hosting does not receive recognition/governance/kernel/KMS secrets;
- Mission-side anchored state requires export + latest checkpoint + pinned-key signature verification.

Money, MCUs, and legal ownership remain separate ledgers.

## Infrastructure Drip direction

The next extension is the two-rail Infrastructure Drip.

### MCU rail

A contributor receives the full human grant.

A separate rule-derived **additional infrastructure allocation** may be appended in the same atomic economic command.

Example:

```text
Human grant:              +100.000000 MCU
Infrastructure allocation:  +1.000000 MCU
```

The allocation is mission-level accounting to a declared dependency Mission.

It is **not**:

- deducted from the human;
- a cash balance;
- legal equity;
- a transferable Mission treasury token;
- a way to pay cloud invoices.

### Cash rail

Dollar infrastructure costs remain on a future money ledger.

The hosted network may later use a transparent, capped, cost-targeting cash fee.

WO-0017 does not move money.

## Active engineering work

Execute:

`docs/work-orders/WO-0017-infrastructure-drip.md`

WO-0017 extends the kernel so a primary human MCU grant can atomically create deterministic, versioned, independently verifiable infrastructure allocations.

It must preserve the accepted WO-0016 grant semantics and must not implement general bounties or cash settlement.
