# Next

Updated: 2026-10-04

## Active engineering

`WO-0013 — 99pct product-shell reset`

See `docs/work-orders/WO-0013-99pct-product-shell.md`.

This work order corrects product identity before we build Contribution or MCU rails.

### Product relationship

**99pct** is the open-source product/platform and Mission.

It is the place where people should eventually be able to:

`start → find → organize → help → contribute → earn MCUs → build ownership`

**Missionism** is the protocol underneath that system.

99pct uses Missionism. It is not the Missionism website under another domain.

### Immediate product goal

Make the live generated-host experience unmistakably 99pct:

- homepage branded 99pct;
- clear “for the 99%, by the 99%” purpose;
- primary actions: Explore Missions, Find Work, Start a Mission;
- live-vs-coming product state shown truthfully;
- new public `/work` discovery page using recorded Work;
- Missionism moved to a supporting `/missionism` protocol hub;
- Principles / How It Works / Specification / Open Questions remain available as protocol material;
- Missionism icon/wordmark removed from global 99pct chrome;
- predecessor demos/simulators remain reachable but leave the primary product navigation/footer;
- global metadata identifies 99pct, not Missionism.

No database schema or production rows change in WO-0013.

After green CI, manually deploy the exact commit with automatic rollouts still off.

## After WO-0013 acceptance

Resume the product loop:

1. Contribution submission by a confirmed helper
2. creator review / recognized Contribution boundary
3. append-only MCU grants + public contribution history
4. public contribution profiles + export/tamper evidence/passkeys
5. legal ownership rails only after Contribution/MCU and legal design are ready

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked. The generated App Hosting URL remains the live product host until that cutover is separately accepted.

Infrastructure hardening remains continuous, including review/removal of ADR-010 dependency exceptions before expiry.
