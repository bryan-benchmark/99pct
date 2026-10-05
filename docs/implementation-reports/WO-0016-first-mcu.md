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

## Pre-canary review

The product-owner review on PR #33 asked for three fixes before the first MCU. No economic history was rewritten. The rule publication and sequence-2 checkpoint remain.

The recognition bridge anchors a grant only after `grantsFromVerifiedCheckpoint` accepts the export, the latest checkpoint, and a signature. Verification uses the pinned public key in `src/economic/checkpoint/economy-ledger-public.ts` and key version 1. The `public_key_pem` column on the checkpoint row is not the trust anchor. A row with the right Mission, sequence, and hash is refused when the signature is invalid, the public key is substituted, or the checkpoint is stale. That regression is `src/missions/anchor-trust.test.ts`.

Contribution replay now compares a SHA-256 of the canonical summary and evidence. The same idempotency key with different evidence returns 409. Migration `0007_contribution_content_hash.sql` stores that hash. Its SHA-256 is `6e7f631eda8e46af6ad94976eb9daf54c73aa897c4993f9d93a0762c5a9645e6`. It was applied to production `missions` while the previous build was still serving. The contributions table was empty, and Mission health stayed ready.

### Who can sign

The ledger key policy still has one binding: `roles/cloudkms.signerVerifier` for `economy-kernel-worker@pct-99.iam.gserviceaccount.com`.

Project IAM has no Cloud KMS role. The setup signatures were made by a project `roles/owner` identity. Owner includes `cloudkms.cryptoKeyVersions.useToSign`, so those calls succeeded without a key-level binding. That owner path is break-glass administration and recovery. It is not the runtime signer, and it was left in place so key recovery stays possible.

`firebase-app-hosting-compute@pct-99.iam.gserviceaccount.com` is not on the key policy. Its project roles are `roles/cloudsql.client`, `roles/developerconnect.readTokenAccessor`, `roles/firebase.sdkAdminServiceAgent`, `roles/firebaseapphosting.computeRunner`, and `roles/storage.objectViewer`. Policy Troubleshooter associated the worker with `roles/cloudkms.signerVerifier` and did not associate App Hosting with a KMS role.

A live `asymmetricSign` call as those service accounts was not completed. A temporary `roles/iam.serviceAccountTokenCreator` binding was added so the operator could mint their tokens; `iam.serviceAccounts.getAccessToken` stayed denied, and both temporary bindings were removed. Each service account IAM policy is empty again.

## Live canary

`e477143abdd4a085f91193b8c4d4a8a76e68eab1` was rolled out as `build-2026-10-05-001`. That revision has 100% of traffic. Automatic rollouts stayed off. The rollback target remains `build-2026-10-04-015` of `3197dbee18cc092b183b1852cfb551bf10cd7155`.

The serving build's only secret binding is `mission-db-password`. `GET /api/health` and `GET /api/missions/health` both returned ready. Economic health returned `ready events=4 grants=1`.

On Work `wo-0010-test-task`:

1. The confirmed helper recorded one Contribution. The page still said that recording a Contribution does not itself create MCUs, and it showed no amount.
2. The Mission creator recognized it. The page then said the grant is not released until the economic checkpoint is anchored.
3. The recognition bridge submitted one intent (`bridged 1`, `anchored 0`).
4. The kernel worker, using `economy_kernel_writer`, processed that command and checkpointed it (`processed 1`).
5. The bridge ran again and recorded the verified anchor (`bridged 0`, `anchored 1`).

The canary checkpoint was signed through the same operator Cloud KMS path as the rule checkpoints. The worker service account still cannot be impersonated from this session, so this signature is the documented project-owner break-glass path. The key policy was not changed.

| Item | Value |
|---|---|
| Contribution | `9da13d3a-c6a9-4bf3-9fb1-acc42f6b3dfb` |
| Content hash | `756aa1201df91c69f39496ef9b63f413c3b542aa9423a10884c5ddedc7fececa` |
| Recognition intent | `8928960a-9a4b-4556-83c7-ecec1d73ece9` |
| Recognition command | `5847410d-60dc-4863-87b3-ad4a82ee3653` |
| `contribution_recognized` | `662a8e0a-1518-40dc-81e5-ec246cff83e3`, sequence 3, hash `3bba7e3f71a21f2301a0249d71f45a548b88fe6a7eb2c3bb51ee2f015600dee2` |
| `mcu_granted` | `d3bb975d-bdde-4f9a-b788-5d836b6b343f`, sequence 4, hash `23b698e0edce5455acb1a6f6c21c4fcb21b803348f3d2e70635953df365e3c99` |
| Amount | `1000000` minor units, displayed as 1.000000 MCU |
| Rule | `fixed-recognition` version 1 |
| Checkpoint | sequence 4, event count 4, same hash, key version 1, `2026-10-05T03:32:56.802Z` |

The verifier export plus that checkpoint plus the pinned public key returned `economic export verified`. The export contains no email address.

Counts after the canary: 4 events, 1 `mcu_granted`, 1 reward key, 1 contribution, 1 recognition, 1 bridge outcome, 1 anchor. There is no bounty reward event.

Retries left those counts unchanged:

- kernel worker: `processed 0`
- recognition bridge: `bridged 0`, `anchored 0`
- a second creator recognition request returned the existing recognition
- the same Contribution key and content returned the same Contribution id
- the same key with different evidence returned 409

The creator view and the helper view both show `Anchored MCU grant: 1.000000 MCU`, rule `fixed-recognition` version 1, and “MCUs record recognized Mission contribution. They are not legal shares or cash.” The signed-out Work page shows the interest and helping counts only.

PR #33 stays open for the final audit. The Infrastructure Drip was not started.

## CI and operations

Code CI on `b2499fd`, run `37256701356`: functional passed, dependency-security passed.

Revised-head CI on `e477143`, run `37258863545`: both jobs passed before this rollout.

Instance `pct99-missions-prod` is `RUNNABLE`. Backups are enabled with 7 retained backups, point-in-time recovery is on, transaction-log retention is 7 days, and deletion protection is on.

No cash bounty, money movement, legal-equity record, DNS change, or predecessor change was made.
