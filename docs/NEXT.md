# Next

Updated: 2026-10-04

## Active engineering

`WO-0008 — Mission production persistence readiness`

See `docs/work-orders/WO-0008-mission-production-readiness.md`.

Goal: make the accepted Start + Discover slice safe to connect to a dedicated Cloud SQL PostgreSQL environment:

- production Cloud SQL Connector path;
- environment binding;
- least-privilege runtime role;
- migration/bind/smoke/backup tooling;
- Mission DB health endpoint;
- Firebase Auth runtime configuration;
- Secret Manager/App Hosting configuration;
- complete Mission PostgreSQL CI;
- exact paid-resource plan and cost gate.

Do not create a new recurring paid Cloud SQL instance until explicit product-owner approval exists.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked on DNS/Firebase preparation. Product work continues independently.

## After WO-0008 acceptance

1. after explicit Cloud SQL spend approval, provision/bind the dedicated Mission database and deploy Start + Discover by exact commit
2. verify live account creation, email verification, Mission create/discover/read, database backups, and rollback
3. Projects + needed Work
4. Join
5. Contribution + append-only MCU history
6. public contribution profiles + export/tamper evidence/passkeys
7. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 exceptions before expiry.

One product vertical slice at a time.
