# Next

Updated: 2026-10-04

## Active engineering

`WO-0012 — Mutual Work participation`

See `docs/work-orders/WO-0012-work-participation.md`.

Goal: extend the live loop from:

`Mission → Project → Work → expressed interest`

to:

`Mission → Project → Work → mutual participation`

Flow:

1. a verified human expresses interest;
2. the Mission creator chooses **Invite to help**;
3. the interested human sees that private invitation;
4. the human chooses **I’ll help on this Work**;
5. the Work page can now truthfully show that someone is helping.

This creates a durable two-party participation boundary for later Contribution records.

It does **not**:

- make the human a Mission member;
- create employment or contractor status;
- create a legal contract;
- promise or record compensation;
- award MCUs;
- issue ownership;
- close the Work item;
- prevent multiple humans from helping the same Work item.

The creator cannot confirm on behalf of the human. The human cannot self-invite.

WO-0012 may migrate the existing Mission production database and manually deploy the exact green commit. The migration must remain additive/backward-compatible with the retained rollback build.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked on DNS/Firebase preparation.

## After WO-0012 acceptance

1. Contribution records tied to a confirmed Work participant
2. contribution evidence/review boundary
3. append-only MCU grants + public contribution history
4. public contribution profiles + export/tamper evidence/passkeys
5. formal legal agreement selection only when activity actually requires it
6. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 exceptions before expiry.

One product vertical slice at a time.
