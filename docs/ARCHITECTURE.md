# Architecture

Updated: 2026-10-03

## Role of 99pct

99pct coordinates. Regulated partners transact.

99pct is the open-source protocol, contribution system, workflow engine, identity and reputation layer, and interface. It orchestrates Missions, work, MCU history, governance, and the display of ownership. It is not the sole authority for a human's legal ownership or money.

```text
99pct.com
├── Human identity
│   ├── public profile
│   ├── passkeys
│   ├── private verified identity
│   └── tax and KYC providers when required
├── Missions
│   ├── constitution
│   ├── legal entity
│   ├── governance
│   └── contributor equity class
├── Work
│   ├── projects, roles, contracts, bounties, evidence
├── MCU engine
│   ├── contribution events, rule version, evidence, approvals, vesting
│   └── cryptographic audit history
├── Equity engine
│   ├── settlement, issuance approval, securities compliance, tax workflow
│   ├── official stock ledger reference
│   └── shareholder documents
├── Governance
│   ├── proposals, discussion, voting, amendments
└── Money
    ├── payroll, payments, distributions, financing
    └── eventual liquidity through a registered partner
```

Build the differentiating pieces: MCUs, attribution, Mission creation, governance, projects, bounties, open-source collaboration, contribution rules, proof of contribution, public history, discovery, reputation, and the interface that hides bureaucracy.

Integrate identity verification, tax documentation, e-signature, banking, payroll, cap table or stock ledger, and later transfer agent or broker infrastructure. Do not invent custody, wallets, or a new financial instrument in application code.

## Three ledgers

No single database controls all three.

### Contribution ledger

99pct controls this. It is an append-only event ledger of recognized contribution and MCU grants, reversals, rule versions, evidence hashes, and the actor or process that authorized each event. Corrections are new events. A balance is a fold over events, not an editable total.

### Equity ledger

When MCUs become ownership, the Mission's legal entity issues shares or units to the person. The authoritative record is the legal stock ledger and the issuance documents, which may be operated by a transfer agent or other independent system. 99pct may keep a synchronized mirror and must point at the external issuance identifier. Deleting a 99pct account does not delete those shares.

Delaware law permits electronic stock ledgers and issuance for a benefit to the corporation. That is context for a later pilot with counsel. It is not an instruction to issue stock from this application.

### Money ledger

Banks, payroll providers, and payment providers hold money. 99pct does not store a cash balance that represents funds the application itself custodies.

## Authentication and authority

Passkeys are the intended default. Recovery restores the account. It does not move shares.

Ordinary session credentials may create posts and complete ordinary work. Changing legal ownership requires step-up authentication, eligibility and restriction checks, a verified destination, independent equity-ledger approval, settlement, reconciliation, and an immutable transfer event.

A change of email or account recovery does not by itself authorize an equity transfer. A security hold after recovery is appropriate.

Mission asset authority uses multiple independent passkeys where practical. Extremely powerful actions require two-person approval. There is no single administrator god mode and no "set ownership percentage" operation.

## Tamper evidence

Periodically commit a Merkle root of the MCU event ledger to one or more independent public timestamp systems. The root is a notary fingerprint. Names, government identifiers, addresses, employment details, contracts, and full cap tables stay off that public record.

Blockchain, if used, is the notary. It is not the bank, and Mission shares are not an ERC-20 or other bearer token.

Duplicate ownership evidence:

```text
A  Independent authoritative legal equity ledger
B  99pct synchronized ownership mirror
C  Encrypted immutable backups
D  Signed legal issuance documents
E  Public cryptographic checkpoint
F  Mission financial and accounting records
```

Copy the transfer-agent recordkeeping philosophy: integrity, detection of modification, recovery, and duplicates. Registration as a transfer agent depends on the securities involved and is not assumed for every Mission on day one.

## Forkability

The protocol defines exportable records for Mission, contributor, contribution event, MCU rule, MCU grant, equity settlement, share issuance, transfer, proposal, vote, and contract. A Mission can leave 99pct and continue on another implementation. Legal entities and legal owners remain. Cryptographic history still verifies.

99pct should be disposable. The ownership should not be.

## What the application database must not become

It must not be the only copy of legal ownership. It must not be a cash custodial balance. It must not store raw Social Security numbers. It must not treat an MCU balance as freely tradable equity.

## Predecessor systems

Inspected 2026-10-03. None of these were moved or rewritten by WO-0001.

| System | Location | What it actually is |
|---|---|---|
| Public site | `Missionism.com`, `origin/main` | Next.js explanatory site plus simulators. Firebase App Hosting on `main`. |
| Feature branch | `feat/mission-workspace-v1` @ `321d4b6` | Adds file-backed Sparks, Pilots, experiments, team-ups, toolshare demos, and a PostgreSQL Mission Workspace. Nine commits ahead of `main`. |
| Protocol spec | `Missionism.com/spec` | `canonical.json` plus explanatory spec markdown. |
| Protocol code | `Missionism/missionism-protocol` | Sibling directory, outside the website git repo. Experimental MCU ledger, Merkle batches, OpenTimestamps-style anchoring. Not the 99pct application. |
| Workspace | `src/workspace` | Private organizations, memberships, contract revisions, decisions, reviews, invitations, append-only audit. Firebase Auth session. Not a public Mission network. |

The Mission Units engine under `src/mission-units` is an experimental calculator and simulator. It is not the production contribution ledger.

Preserve this stack. WO-0001 does not authorize a framework rewrite.
