# WO-0016 — Contribution recognition and the first MCU issuance

Date: 2026-10-04

Product-owner approval, recorded in the control plane on 2026-10-04:

> I approve the Cloud KMS spend for WO-0016.

## Pricing recheck

Immediately before the key was created, the Cloud KMS pricing page (effective March 17, 2025) and the `CryptoKeyVersionAlgorithm` reference were checked again.

- Software-backed active asymmetric elliptic-curve key versions: $0.000082192 per hour, about $0.06 per month.
- Cryptographic operations: $0.03 per 10,000.
- Admin operations: free.
- `EC_SIGN_ED25519` remains EdDSA on Curve25519 in pure mode, taking raw data.
- The key uses protection level `SOFTWARE`. HSM was not used.

That matches the approved envelope. No renewed approval was required.

## Signing key

| Item | Value |
|---|---|
| Project | `pct-99` |
| Location | `us-central1` |
| Key ring | `economy-checkpoints` |
| Key | `economy-ledger` |
| Version | `projects/pct-99/locations/us-central1/keyRings/economy-checkpoints/cryptoKeys/economy-ledger/cryptoKeyVersions/1` |
| Purpose | asymmetric signing |
| Algorithm | `EC_SIGN_ED25519` |
| Protection | `SOFTWARE` |
| State | `ENABLED` |
| Created | 2026-10-05T02:52:12Z |

The public key was retrieved. The version description contains no private key material. The only key IAM binding is `roles/cloudkms.signerVerifier` for `economy-kernel-worker@pct-99.iam.gserviceaccount.com`. App Hosting is not on that policy, and `apphosting.yaml` still references only `mission-db-password`.

The operator account invoked the first signatures because the worker service account cannot be impersonated from this session. The key policy was not widened.

A probe signature verified locally with the retrieved public key. The rule checkpoint below also verified.

## Migrations

Applied while the previous application build was still serving. Mission health stayed `ready`.

| Migration | SHA-256 |
|---|---|
| `src/missions/db/migrations/0006_contributions.sql` | `a52947125717fae8f7670d8525c5d6cb78c6b50f8eb55d87e3db2f0433c350db` |
| `src/economic/db/migrations/0004_checkpoints.sql` | `42d6cf4534c31c3388b9f1800f903c045626252605fab1e231274bc0c1d6004c` |

`economy` had four migrations and zero events before the rule publication. Economy grants were reapplied, including `INSERT` on `economic.checkpoints` for `economy_kernel_writer` and `SELECT` for the other economy roles.

The recognition bridge identity is `missions_bridge`. Its password is `mission-bridge-password`. That secret has no IAM bindings. The role is `NOINHERIT`, is not a member of `cloudsqlsuperuser`, and can insert only bridge outcomes and anchors.

## Rule

The canary Mission is the existing public Mission `wo-0009-test-mission` (`89846b6c-9ce2-4126-8aee-f2964074d3e0`), Project `wo-0010-test-project`, Work `wo-0010-test-task`. That Work already had one confirmed helper. No email is recorded here.

Governance publication used `economy_governance_submitter`. The kernel writer appended the events and the Cloud KMS signer checkpointed them.

| Step | Id |
|---|---|
| Publish intent | `4c1a0e08-1917-4deb-95e2-398e3ccff7ec` |
| Publish command | `aa0ff1e2-5cc5-4378-adb3-a31681b6081b` |
| `rule_published` event | `1e932fb8-f759-42a6-8d49-353d6d06a311` |
| Activate intent | `27deb366-f0de-4836-a893-aa2941229680` |
| Activate command | `c0d934ed-dea0-42a9-a3ae-a6bbd851af0f` |
| `rule_activated` event | `4d3db383-9774-4dd7-be25-7781721cf38d` |

Rule `fixed-recognition` version 1, kind `fixed_mcu_on_recognition`, amount `1000000` minor units (scale 6, displayed as 1.000000 MCU).

Checkpoints, both signed by key version 1 and verified against the export with the stored public key:

| Sequence | Event hash |
|---|---|
| 1 | `8bf43e7625bfc4820668c94185b39fcd1625a2b3eebb824633ae9731888cc8f9` |
| 2 | `f5c6cbef2f9dfeb3fff022e6ed3342b127d56139a953481673ab6012e6d8ef78` |

`economic.reward_keys` is still empty. There is no `contribution_recognized` event and no `mcu_granted` event.

## What is still waiting

The first MCU grant has not been issued. It requires the confirmed helper to record a Contribution and the Mission creator to recognize it through the product, then the isolated bridge and kernel worker. That path is not available on the current serving build, and this change was not rolled out. Automatic rollout settings were left as they were.

## CI and operations

Code CI on `b2499fd`, run `37256701356`: functional passed, dependency-security passed.

Instance `pct99-missions-prod` is `RUNNABLE`. Backups are enabled with 7 retained backups, point-in-time recovery is on, transaction-log retention is 7 days, and deletion protection is on.

No cash bounty, money movement, legal-equity record, DNS change, or predecessor change was made.
