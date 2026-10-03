# Next

Updated: 2026-10-03

Do not start these slices until ADR-004 is accepted. The code is not in this repository.

The first live loop:

```text
Visitor discovers or starts a Mission
→ Mission contains Projects and needed Work
→ another human joins
→ a contribution is recorded
→ MCU history can be viewed
```

Smallest sequence. Each item is one future work order, not a backlog to build in parallel.

## WO-0002 — Choose the working tree

Accept or rewrite ADR-004.

If the choice is the existing application, move this `docs/` tree into `Missionism.com` in that work order so agents stop reading two brains. If the choice is this repository, import `bryan-benchmark/missionism` with history.

Non-goals: new product behavior, MCU rules, equity, payments.

## WO-0003 — Start or discover a Mission

One vertical slice on top of the preserved stack.

User outcome: a visitor can write what should exist and save a draft Mission, and another visitor can open a list of draft Missions.

Likely predecessor to reuse: Spark creation and the Spark page. Map deliberately in the work order. Do not leave "Spark" and "Mission" as two unlabeled products.

Non-goals: projects, MCU issuance, accounts beyond what the slice needs, equity, payments.

Acceptance shape: authorized create and public read persist after reload; the Mission belongs to its creator; existing homepage and canonical badge check stay green.

## WO-0004 — Projects and needed work

From a Mission, an authorized member creates a Project with a title, purpose, and status, and posts a piece of needed Work on it.

Non-goals: bounty amounts that mint MCUs, payments, equity, voting.

Server-side authorization is required (SEC-010). A stranger receives a refusal from the server.

## WO-0005 — Join

A second human can join the Mission or the Work with an explicit membership record. Anonymous file-based "interest" can remain as a signal, and it is not membership.

Non-goals: employment classification, tax forms, equity paperwork. The slice may show a placeholder agreement only if the work order specifies the exact text and states that it is not a legal template.

## WO-0006 — Record a contribution and show MCU history

Completing accepted Work appends a Contribution and an MCU event under a single published rule version for that Mission. The Mission page lists the events. Totals are derived. Corrections are compensating events (SEC-002, SEC-006).

The UI calls the numbers MCUs earned. Equity settlement reads "Not yet issued" (SEC-007, SEC-008).

Non-goals: share issuance, wallets, transfers, Merkle publication. Those are later orders after this ledger is real.

## Explicitly not next

Securities issuance, broker or ATS integration, payroll, SSN collection, passkey migration, secondary trading, and rewriting `canonical.json`.

Passkeys, export, and a public Merkle checkpoint should follow the first ledger, as their own orders, before any equity pilot.

## After the loop

One U.S. pilot Mission with securities counsel, then payouts, then equity settlement against an external ledger, then repurchase, financing, collateral, and only then regulated secondary liquidity. The front end of the loop should stay stable while that plumbing is added.
