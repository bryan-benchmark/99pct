# Next

Updated: 2026-10-04

## Active engineering

`WO-0010 — Projects + needed Work`

See `docs/work-orders/WO-0010-projects-and-work.md`.

Goal: extend the live Mission loop from:

`Mission`

to:

`Mission → Project → Work`

The first slice should let a Mission creator:

- create a bounded Project;
- describe the outcome the Project exists to produce;
- post needed Work under that Project;
- publish a clear description of what needs doing and what “done” means.

Anyone can read Projects and open Work without an account.

Until Join exists, only the Mission creator may mutate these objects.

Open Work is a request for help only. It does not create:

- a job offer;
- employment;
- an independent-contractor agreement;
- compensation;
- a bounty;
- an MCU grant;
- legal ownership;
- a promise that the Mission will accept someone.

WO-0010 may migrate the existing production Mission database and manually deploy the slice after green CI.

## Waiting externally

`WO-0006 — 99pct.com controlled domain cutover`

PR #11 remains parked on DNS/Firebase preparation. The generated App Hosting URL remains the product host until that cutover is separately accepted.

## After WO-0010 acceptance

1. Join / express interest in Work
2. agreement boundary for accepted Work
3. Contribution records
4. append-only MCU grants + public contribution history
5. public contribution profiles + export/tamper evidence/passkeys
6. legal-equity pilot only after the contribution foundation and appropriate legal design exist

Infrastructure hardening remains continuous, including review/removal of ADR-010 exceptions before expiry.

One product vertical slice at a time.
