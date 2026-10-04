# Next

Updated: 2026-10-04

## Active

`WO-0006 — 99pct.com controlled domain cutover`

See `docs/work-orders/WO-0006-99pct-domain-cutover.md`.

Goal: move public web traffic to the already-proven 99pct App Hosting backend with minimal blast radius.

Canonical public host:

`https://99pct.com`

`https://www.99pct.com` redirects to the apex.

The cutover must preserve registrar ownership, nameserver delegation, email/MX/TXT records, automatic-rollout-off state, the predecessor deployment, and workspace fail-closed behavior.

## After WO-0006 acceptance

1. start/discover a Mission
2. Projects + needed Work
3. Join
4. Contribution + append-only MCU history
5. export/tamper evidence/passkeys
6. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 dependency exceptions before their expiry.

One vertical slice at a time.
