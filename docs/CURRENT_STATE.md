# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Mission → Project → Work → participation accepted through WO-0012
- 99pct public shell accepted in WO-0013
- Economic kernel foundation accepted in WO-0014 at `208f2be`
- Production economic shadow boundary accepted in WO-0015 at `2a3e13c`
- Application source license: `AGPL-3.0-only`

## Product identity

**99pct is the product/network/Mission. Missionism is the protocol underneath it.**

99pct is being built as a shared human-commerce substrate with Use / Operate / Build modes and future Utility Missions.

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live release remains:

- application commit `3197dbee18cc092b183b1852cfb551bf10cd7155`
- build `build-2026-10-04-015`
- automatic rollouts off
- Mission health ready

No product rollout occurred in WO-0015.

## Production Mission data

Cloud SQL instance:

- project `pct-99`
- region `us-central1`
- instance `pct99-missions-prod`

Mission product database:

`missions`

The live product loop remains:

`Mission → Project → Work → Interest → Invitation → Confirmation → Helping`

## Production economic shadow boundary

WO-0015 created a separate production database:

`economy`

It is isolated from `missions` by database name, roles, migrations, grants, secrets, and runtime authority.

Current production economic state:

- events: 0
- commands: 0
- command intents: 0
- intent outcomes: 0
- rule versions: 0
- reward keys: 0

There are **zero real MCUs and zero production bounty rewards**.

## Economic authority boundary

Production roles are capability-separated:

- human/application submitter;
- Contribution-recognition submitter;
- governance/rule submitter;
- bounty-recognition submitter;
- private kernel writer;
- read-only verifier.

Privileged process identity is derived from the trusted capability channel, not supplied by browser JSON.

The kernel writer is the only role that can append authoritative economic history.

App Hosting has no access to the kernel-writer credential.

The private worker identity can access only the kernel-writer secret plus the Cloud SQL connection permission it needs.

## Recovery and verification

The production boundary now has:

- checksum-tracked economic migrations;
- append-only intent outcomes;
- role/grant checks;
- disposable backup/restore verification;
- production read-only health tooling;
- production export tooling;
- the offline economic verifier;
- `economic-checkpoint-v1` signing/verification format.

Cloud SQL backups, PITR, and deletion protection remain enabled.

## KMS gate

No Cloud KMS key exists yet.

The planned signer is a non-exportable software-backed asymmetric key using `EC_SIGN_ED25519`.

Current public Google Cloud pricing is approximately:

- $0.06/month per active software key version;
- $0.03 per 10,000 cryptographic operations.

Product-owner approval was explicitly recorded on 2026-10-04:

> I approve the Cloud KMS spend for WO-0016.

The KMS spend gate is satisfied. Before creating the resource, WO-0016 must still recheck current Google Cloud KMS pricing and `EC_SIGN_ED25519` availability. A material pricing/configuration change requires renewed approval.

## Active engineering work

`WO-0016 — Contribution recognition + first MCU issuance`

Status:

**ACTIVE — CLOUD KMS SPEND APPROVED 2026-10-04**

WO-0016 may execute under the approved KMS configuration/cost envelope, subject to its required current-price/availability recheck before resource creation.

No production MCU may be created before the KMS signing key/checkpoint path is provisioned and verified.
