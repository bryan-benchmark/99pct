# Next

Updated: 2026-10-04

## Blocked release

`WO-0009 — Provision and deploy Start + Discover`

See `docs/work-orders/WO-0009-provision-and-deploy-missions.md`.

Status:

**BLOCKED — EXPLICIT CLOUD SQL SPEND APPROVAL REQUIRED**

Do not start WO-0009 merely because billing is enabled.

After explicit approval, the order will:

1. create the dedicated Mission Cloud SQL instance;
2. create database + separate migration/runtime users;
3. migrate and bind the database;
4. apply least-privilege runtime grants;
5. create the Secret Manager runtime password;
6. grant only required IAM to the App Hosting serving service account;
7. create a Firebase Web App and enable Email/Password Auth;
8. authorize the generated App Hosting domain for Auth;
9. update the real App Hosting configuration;
10. manually deploy an exact accepted commit;
11. prove live sign-up / verification / sign-in / Mission create / discover / read;
12. prove Mission health, backups/PITR posture, generated-domain fallback, and rollback.

No custom-domain dependency is required for that release.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked on DNS/Firebase preparation. It can finish independently after the generated-domain Mission release is healthy.

## After Start + Discover is live

1. Projects + needed Work
2. Join
3. Contribution + append-only MCU history
4. public contribution profiles + export/tamper evidence/passkeys
5. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including removal/review of ADR-010 exceptions before expiry.

One product vertical slice at a time.
