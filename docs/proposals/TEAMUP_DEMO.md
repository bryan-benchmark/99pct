# Team-Up candidate demo

**Status:** Experimental product prototype. No Mission has accepted a Team-Up.

This implements a draft of step 6 in [Mission Network v0](./MISSION_NETWORK_V0.md). The fictional Toolshare and Repair Missions provide a concrete example: a flagged tool could be inspected and given a documented disposition. The form records the shared purpose, each side's contribution and decision authority, joint approvals, deliverable, success measure, resource limit, proposed settlement, coordination, end date, and early stop rule. A saved URL is a review artifact, not an executed contract.

## Mission boundaries

Each Mission keeps its own authority and ledger. The example expressly gives Toolshare control over inventory availability and Repair control over inspection methods. Any real compensation or MCU allocation would need terms in the issuing Mission's prospective contract and ledger. A Team-Up does not create a shared global MCU pool. The demo writes no compensation or unit event.

## Acceptance path beyond the demo

Before a real Team-Up starts, identify authorized stewards for both Missions, verify their acceptance of the same version, confirm the participating services and resources exist, define the safety handoff and incident process, and record actual settlement and any Mission-specific unit rules. Changes to scope or authority require fresh approval. The local form does none of those checks.

## Local storage

Candidate proposals are saved as JSON in `.data/teamups/` and excluded from Git. Links work only on this installation. Public use would require durable storage, access controls, moderation, versioned signatures or approvals, and a change history. Form text is publicly visible to anyone holding its local URL, so do not enter private data.
