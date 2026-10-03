# Mission Network v0 — implementation sequence

**Status:** Proposed product plan. This is not canonical protocol.

The [shared research conversation](https://chatgpt.com/share/6ab92761-3b20-83ea-8b5c-4aa50904c3a6) describes a network in which anyone can propose something that should exist, gather the inputs needed to test it, use the resulting Mission, and share what the network learns. The first release should test that path before encoding a new economic or constitutional rule.

## Product loop

`Wish → Spark → Pledge → Pilot → Mission → Use → Learn`

- **Spark:** A person states a need and drafts a public proposal. No entity, ownership, or fundraising is implied.
- **Pledge:** People express demand or offer money, work, skills, assets, or space. A pledge must state whether it is an expression of interest or a binding commitment; v0 starts with interest only.
- **Pilot:** The group tests a small service with a named steward, a success measure, a funding source, and an end date.
- **Mission:** A working pilot can enter the existing Mission Contract and Mishys Launch flow. Only then do legal formation and Mission Unit rules become relevant.
- **Use:** People can buy, borrow, book, or subscribe to a live service.
- **Learn:** Missions retain raw operational data locally and can share approved aggregate findings. Cross-Mission experiments require an explicit proposal and human review.

## Build order

1. **Spark prototype — implemented locally.** One plain-language entry point produces an editable draft with a need, beneficiaries, place, first pilot, success evidence, and requested inputs. It creates no real Mission.
2. **Interest page and persistence — implemented locally.** Save proposals to a server-side file store; provide stable links within one installation; accept nonbinding expressions of demand, work, skill, assets, space, and possible funding. Show counts as unverified browser responses, with one response per browser cookie and no personal data collected. This does not establish unique people or validated demand.
3. **Pilot gate — candidate plan implemented locally.** Require a proposed steward role or team, bounded operating plan, end date, economic mode, possible funding source, resource limit, success measure, human and safety guardrails, participant notice, and stop rule. A complete candidate is ready for human review; the app cannot approve or start it.
4. **Use one Mission — local Toolshare demo implemented.** Fictional inventory supports availability, reservation, check-out, return, and incident handling. A real pilot still requires approved operations and measured demand and cost before a broad marketplace.
5. **Learning foundation — local event vocabulary implemented.** Toolshare actions use a small versioned, append-only vocabulary; the UI derives state and demo counts from those events. Cross-Mission aggregate queries and privacy controls remain to be designed and reviewed.
6. **Team-Up — candidate proposal implemented locally.** The Toolshare × Repair example captures purpose, contributions, deliverable, authority, joint decisions, resource and settlement terms, success measure, end date, and early stop rule. A real agreement still needs authorized stewards, consent, funding, legal review where applicable, and each Mission's prospective contract and ledger rules before any MCU issuance.
7. **Protocol experiments — proposal registry implemented locally.** A Toolshare example records hypothesis, intervention, comparison, exposure class, primary outcome, human guardrail, participant notice and consent, stop rule, evidence plan, review date, and adoption decision rule. The registry cannot enroll or expose participants, collect outcomes, approve a test, or change a Mission or protocol default. Local Missions retain the choice to adopt eligible changes after review.

## Boundaries to preserve

- The website's `spec/canonical.json` remains the current normative source. New mechanics above are proposals until separately reviewed and adopted.
- A Spark or interest pledge creates no equity, MCU, legal entity, payment obligation, or promise of future service.
- MCU is already defined per Mission. A Team-Up must specify which Mission issues which units; a shared pool cannot silently become a global pie.
- Human decisions govern consequential experiments and protocol promotion. The experiment engine cannot change constitutional rights or ownership guarantees.
- Raw transcripts, salaries, and personal records stay under each Mission's control; an aggregate analytics design does not by itself guarantee privacy.

## First-step acceptance

A visitor can enter a wish, add enough context to make it testable, see an accurate draft, edit it, and understand that the proposal is only a prototype. No invented AI analysis, pledges, company formation, or ownership claims appear.

## Second-step acceptance

The visitor can save the draft, open its stable local URL, copy that URL, record one or more nonbinding types of interest, see the counts update, and reload without losing the proposal or their response. A second response from the same browser is rejected. The page explains that counts are unverified browser responses and that public deployment needs different storage.

## Local storage boundary

Spark records are written to `.data/sparks/` and excluded from Git. They survive a local server restart but do not synchronize across machines or survive ephemeral hosting. A durable public deployment requires a hosted database, abuse controls, moderation, and a migration of existing local records. Interest choices have no contact channel; they are useful for testing the interaction, not for recruiting or fundraising.

## Vision versus pilot

The [later shared conversation](https://chatgpt.com/share/6ab92761-3b20-83ea-8b5c-4aa50904c3a6) adds two broad candidate Visions: **Food From First Principles** and **Reduce Life Complexity**. A Vision names a durable outcome and can contain many Sparks and Missions. It is not itself evidence that a particular experiment is safe, feasible, or funded.

Illustrative first cuts, not approved plans:

- Food: compare a small set of published candidate ingredients against a stated taste, nutrition, cultivation, and safety rubric. Any cultivation, genetic modification, or human food trial needs domain-specific review before it begins.
- Daily life: ask a small opt-in household group to try a simple laundry or “tomorrow pod” layout, then measure minutes and human interventions saved while checking autonomy, delight, privacy, and safety. No robot or biometric system is needed to test the interface idea.

Both examples keep the proposed design principle **standardize interfaces, not humans**. A complete form is only a request for review, not a substitute for expert judgment or participant consent.
