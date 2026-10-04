# Next

Updated: 2026-10-04

## Active engineering

`WO-0007 — Mission foundation: Start + Discover`

See `docs/work-orders/WO-0007-mission-foundation.md`.

Goal: replace prototype-only Mission creation with the first real public Mission domain:

- verified human account
- Start a Mission
- durable PostgreSQL model
- public Mission discovery
- public Mission page
- explicit forming / no-MCUs / no-legal-ownership state

Build and verify the slice in code first. Do not create paid production database infrastructure or deploy it in this work order.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains blocked on Afternic/Firebase ownership and certificate preparation. It is not the active engineering task.

When Firebase preparation becomes ready, resume only the DNS cutover steps; do not mix product code into that PR.

## After WO-0007 acceptance

1. provision/bind a dedicated 99pct Mission PostgreSQL environment and deploy Start + Discover
2. Projects + needed Work
3. Join
4. Contribution + append-only MCU history
5. public contribution profiles + export/tamper evidence/passkeys
6. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 dependency exceptions before expiry.

One product vertical slice at a time.
