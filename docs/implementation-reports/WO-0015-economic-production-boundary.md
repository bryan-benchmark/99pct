# WO-0015 — Economic production boundary / shadow ledger

Date: 2026-10-04

The production economic boundary exists and contains no economic value. No MCU grant, bounty reward, Contribution recognition, money movement, or legal-ownership event was created. No product rollout, DNS change, or Cloud KMS key was made.

## Production database

| Item | Value |
|---|---|
| Project | `pct-99` |
| Instance | `pct99-missions-prod` |
| Region | `us-central1` |
| Database | `economy` |
| Mission database | `missions`, unchanged in schema and rows |

The economic tables are not in `missions`. `economy` is owned by `economy_migrate`. `PUBLIC` does not have `CONNECT` on `economy`.

Cloud SQL users are created as members of `cloudsqlsuperuser` by default. That membership was revoked for every economy role. Each economy role is `NOINHERIT`, `NOCREATEDB`, and `NOCREATEROLE`.

`PUBLIC` also lost `CONNECT` on `missions`, so the new economy roles cannot open the Mission database. `missions_runtime` and `missions_migrate` keep `CONNECT`. A `missions_runtime` connection succeeded, and the live Mission health route stayed ready.

Backups remain enabled with 7 retained backups, point-in-time recovery enabled, transaction-log retention of 7 days, and deletion protection enabled. Nothing on the instance was destroyed.

## Migrations

Applied to `economy` only, with `ECONOMIC_PRODUCTION_SHADOW=1`:

| Migration | SHA-256 |
|---|---|
| `0001_economic_kernel.sql` | `b9a08b23dc9c900594f80b8bf25fc796b3c4dfade917442df7963a1c6faab349` |
| `0002_command_intents.sql` | `b25b2a3484963f49b7bb0b853db32f074d1a4529b67b2f5603070a73ba9e82df` |
| `0003_capability_boundary.sql` | `4258fd0fab733b997009201304b6db322589b7806a4f5ac0215afb749d2ff20b` |

`0003` adds the trusted submitter capability, the append-only `economic.intent_outcomes` table, and four `SECURITY DEFINER` submission functions. Those functions are an authorization boundary. Reward math stays in the TypeScript kernel.

## Roles and capabilities

| Role | Channel |
|---|---|
| `economy_app_submitter` | `submit_human_intent` only. The command type is fixed to `confirm_bounty_participation` and the actor kind is fixed to `human`. |
| `economy_recognition_submitter` | `recognize_contribution` and `adjust_mcu`, as process `recognition`. |
| `economy_governance_submitter` | `publish_rule` and `activate_rule`, as process `rule-publisher`. |
| `economy_bounty_recognition_submitter` | `recognize_bounty_completion`, as process `bounty-recognition`. |
| `economy_kernel_writer` | Appends commands, events, rule versions, reward keys, and one intent outcome. No update, delete, or truncate. |
| `economy_verifier` | `SELECT` only. |
| `economy_migrate` | Operator migration and grants. Not used by App Hosting. |

No submitter can insert commands, events, rule versions, reward keys, or raw intent rows. A client-supplied actor string cannot select another channel. `PUBLIC` cannot execute the submission functions.

Production checks after grants:

- all six runtime roles matched the expected privileges
- `economy_app_submitter` was denied `INSERT` on `economic.events`
- `economy_kernel_writer` was denied `TRUNCATE` on `economic.events`
- `economy_app_submitter` was denied `CONNECT` on `missions`

## Secrets

Secret Manager names, with no values recorded:

- `economy-db-migration-password`
- `economy-app-submitter-password`
- `economy-recognition-submitter-password`
- `economy-governance-submitter-password`
- `economy-bounty-recognition-submitter-password`
- `economy-kernel-writer-password`
- `economy-verifier-password`

App Hosting has no binding on any of these secrets. `apphosting.yaml` was not changed.

## Worker identity

Service account `economy-kernel-worker@pct-99.iam.gserviceaccount.com` can use the Cloud SQL connector and can read only `economy-kernel-writer-password`. No JSON key was downloaded. No Cloud Run service or job was deployed, so the worker is not an always-on paid runtime. `npm run economy:worker` is the drain command, using that credential when an operator or a future isolated job runs it.

The worker reads pending intents, derives the actor from the stored capability, revalidates the command, appends the kernel result, and writes one append-only outcome. Concurrent workers use a transaction advisory lock. A command that committed before its outcome still replays to the same receipt and then receives one outcome.

## Empty shadow ledger

Verifier counts on production `economy`:

| Table | Rows |
|---|---|
| events | 0 |
| commands | 0 |
| command intents | 0 |
| intent outcomes | 0 |
| rule versions | 0 |
| reward keys | 0 |

`npm run economy:health` with the empty-ledger requirement printed `ready events=0 grants=0`.

## CI and disposable recovery

Run `37251214598` on `c01e76d`:

- `dependency-security` passed
- `functional` passed, including capability separation, concurrent reward tests, and a logical dump/restore of the disposable economic database

A local disposable PostgreSQL 18 cluster passed the same role, worker, race, and restore checks before the pull request. Restored history verified offline, and grants could be reapplied from the SQL files.

## Checkpoints and KMS

`economic-checkpoint-v1` signs the canonical Mission id, last sequence, last event hash, event count, timestamp, and signer reference with Ed25519. CI covers a valid signature and rejection of a changed sequence, event hash, Mission, public key, reordered history, and corrupted history.

The expected production signer is a non-exportable Cloud KMS asymmetric key:

- project `pct-99`
- location `us-central1`
- key ring `economy-checkpoints`
- key `economy-ledger`
- purpose `ASYMMETRIC_SIGN`
- algorithm `EC_SIGN_ED25519`
- protection level software, which is still non-exportable
- the worker identity would receive only `cloudkms.signer` on that key
- App Hosting would receive no signing permission
- data access audit logs would stay enabled

Status: **blocked pending product-owner approval**. The Cloud KMS API is not enabled on `pct-99`, no key ring was created, and no key was created. Pricing and API requirements must be rechecked immediately before any future creation.

Future checkpoints should be published outside the database as append-only versioned objects, one per Mission sequence, containing the signed checkpoint and the public key reference. They must not contain private identity. A verifier combines the economic export, the public key, and the checkpoint. No production checkpoint was published because the ledger has no events and no approved signing key.

## Live product

No App Hosting rollout was made. Automatic rollouts stay off. After the database privilege change:

- `https://pct99--pct-99.us-central1.hosted.app/api/health` returned ready
- `https://pct99--pct-99.us-central1.hosted.app/api/missions/health` returned ready

No DNS, predecessor, or Workspace behavior was changed.
