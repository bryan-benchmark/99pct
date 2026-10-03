# Decisions

Architecture Decision Records. Accepted records are binding. Proposed records are not implemented until a human accepts them.

Cursor does not silently replace an accepted record. A conflicting implementation stops and adds a proposed record.

## ADR-001 — MCUs are contribution units, not bearer securities

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Decision: MCUs represent recognized contribution. They are not assumed to be transferable legal securities. Legal shares or other instruments are a separate ledger, created only when a Mission's legal process issues them.

Reason: Naming a unit an MCU does not change the economic reality. If the unit itself can be bought, sold, appreciate with the company, or automatically function as stock, it is the wrong primitive for day one. Contribution measurement should stay independent of each Mission's securities infrastructure.

Implication: The application must not describe transferring MCUs as transferring legal shares. SEC-007 and SEC-008 apply.

Not done in WO-0001: No edit to `spec/canonical.json`. No edit to `spec/MCU_PROTOCOL.md` or `spec/ECONOMIC_PHILOSOPHY.md`. Those files currently say both that an MCU is not a share certificate and that an MCU is a mission-local ownership claim. The sibling `missionism-protocol` README says an MCU is a contribution credit and a claim on one Mission pie. Resolving that wording is a later decision. See the proposed record below.

## ADR-002 — Three ledgers, and 99pct is not the ownership authority

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Decision: Contribution and MCUs, legal equity, and money are separate ledgers. No one application database is authoritative for all three. 99pct may orchestrate them. Legal ownership lives in the Mission's legal ledger. Money lives with regulated financial infrastructure.

Reason: A compromise of the website, or the disappearance of 99pct, must not transfer or erase people's companies.

Implication: SEC-001 through SEC-005, SEC-007, OWN-007, OWN-008, and OWN-012.

## ADR-003 — Do not rewrite the predecessor stack in the foundation pass

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001 constraint

Decision: The Next.js, Firebase App Hosting, Firebase Auth, and PostgreSQL workspace stack stays. WO-0001 adds no application code and does not import that repository into this one.

Reason: The foundation pass is a handoff protocol. A framework rewrite or a silent repo merge would hide the current system and invent structure.

Implication: Implementation of the product loop waits until ADR-006 is accepted. The control plane itself is ADR-004.

## ADR-004 — This GitHub repository is the control plane

Status: Accepted  
Date: 2026-10-03  
Source: product owner, after confirming `bryan-benchmark/99pct` was an empty public repository on `main`

Decision: `https://github.com/bryan-benchmark/99pct` is the permanent shared control plane. Vision, product, architecture, security invariants, data model, decisions, current state, next work, work orders, implementation reports, and `spec/canonical.json` live here.

`spec/canonical.json` is an unmodified import of the Missionism.com file as of 2026-10-03. Later claim edits happen in this file, after an accepted ADR. The website copy is the predecessor and must not be edited in parallel.

Reason: Humans and coding agents need one repo to read and one commit history to audit. Chat transcripts are not the source of truth.

Implication: Application code is still not in this repository. See ADR-006.

## ADR-005 — Reconcile dual MCU wording with ADR-001

Status: Proposed  
Date: 2026-10-03

Proposal: A later documentation work order should reconcile `spec/MCU_PROTOCOL.md`, `spec/ECONOMIC_PHILOSOPHY.md`, and `missionism-protocol` with ADR-001.

The reconciliation has to preserve anything already true in those files: MCUs are not share certificates, history is append-only, geography does not discount equal verified contribution, and there is no global MCU market. It has to remove or reclassify any sentence that makes an MCU itself an ownership claim, if the product owner confirms ADR-001.

Do not perform that edit until this record is accepted. `spec/canonical.json` does not contain the dual-MCU sentence, so this is not a canonical-claim change unless someone proposes one. Claim text has one control-plane file, this repo's `spec/canonical.json`.

## ADR-006 — Where application code changes land

Status: Proposed  
Date: 2026-10-03

Proposal: The control plane is this repository. The Next.js application remains `bryan-benchmark/missionism` until a work order chooses one of these:

1. Implement product slices in `bryan-benchmark/missionism`, with this repo remaining the design authority.
2. Import `bryan-benchmark/missionism` into this repository with history, then implement here.

Until this is accepted, agents do not copy the application and do not start the Mission loop.
