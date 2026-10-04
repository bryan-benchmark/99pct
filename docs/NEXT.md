# Next

Updated: 2026-10-04

## Active engineering

`WO-0011 — I want to help: Work interest`

See `docs/work-orders/WO-0011-work-interest.md`.

Goal: extend the live loop from:

`Mission → Project → Work`

to:

`Mission → Project → Work → expressed interest`

A verified human who is not the Mission creator can open a Work item and choose:

**I want to help**

That action:

- records one immutable interest for that human + Work item;
- may include a short private note;
- requires explicit consent to share the human’s verified email with the Mission creator;
- lets the Mission creator privately see interested humans and their notes;
- may show only an aggregate interest count publicly.

It does **not**:

- make the human a Mission member;
- assign the Work;
- create employment or contractor status;
- create a contract;
- promise compensation;
- issue MCUs;
- issue ownership;
- guarantee acceptance.

The next slice after this will own acceptance/agreement boundaries.

WO-0011 may migrate the existing Mission production database and manually deploy the exact green commit. The migration must be additive/backward-compatible with the retained rollback build.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked on DNS/Firebase preparation.

## After WO-0011 acceptance

1. creator reviews interest and accepts a person into a Work agreement boundary
2. agreement/assignment record
3. Contribution records
4. append-only MCU grants + public contribution history
5. public contribution profiles + export/tamper evidence/passkeys
6. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 exceptions before expiry.

One product vertical slice at a time.
