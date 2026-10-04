# Product

Updated: 2026-10-04

## What 99pct is

99pct is an open-source place for people to build the future together.

A person should be able to arrive with something that ought to exist, start a Mission, break it into Projects and Work, find other humans who want to help, record what was contributed, and build a transparent history of who made the Mission real.

The long-term product is infrastructure for the 99%, by the 99%: make it dramatically easier for ordinary people to start, join, copy, improve, fork, fund, and operate useful Missions without needing a venture-backed company or a centralized conglomerate to organize every opportunity.

99pct itself is one Mission built using Missionism.

## Relationship to Missionism

99pct and Missionism are different layers.

**99pct is the product and Mission.**

**Missionism is the underlying organizational protocol / operating philosophy.**

Missionism describes how mission, contribution, ownership, authority, governance, incentives, and human dignity can fit together. 99pct implements and experiments with those ideas in a real open-source product.

The public 99pct product must not require a visitor to understand Missionism before doing something useful.

A useful shorthand:

> 99pct is what we are building. Missionism is how it works.

The Missionism protocol material remains available through its own supporting surface: definition, principles, how it works, specification, open questions, and change history.

## Primary product loop

The target loop is:

```text
Land
→ discover a Mission, find Work, or start a Mission
→ create or join a Project
→ publish or choose needed Work
→ humans mutually agree to help
→ Contribution is recorded
→ Contribution is reviewed / recognized
→ MCUs are issued under the Mission's published rules
→ contribution history is transparent
→ legally valid ownership may settle on a separate rail where implemented
```

The current live implementation reaches mutual Work participation. Contribution, recognition, MCUs, and ownership rails remain later work.

## Product entry points

The primary 99pct shell should optimize for action:

1. **Explore Missions** — see what people are trying to make real.
2. **Find Work** — see open tasks and roles that need help.
3. **Start a Mission** — create a public forming Mission around something that should exist.

Protocol explanation is secondary navigation, not the front door.

## Core objects

| Object | Meaning |
|---|---|
| Mission | The enduring purpose/organization people are trying to make real. |
| Project | A bounded outcome the Mission needs. |
| Work | A task or ongoing role a Project needs help with. |
| Human participation | Interest, invitation, and mutual confirmation around Work. |
| Contribution | A durable record of what a human actually contributed. |
| MCU | A Mission Contribution Unit issued only for recognized Contribution under published Mission rules. |
| Post | Communication: ideas, research, arguments, updates, questions. |
| Proposal | A proposed change to software, rules, strategy, governance, or contracts. |

Posts and Proposals are part of the long-term graph but are not yet the core live loop.

## Current implementation truth

Live now:

- verified human accounts;
- public forming Missions;
- Projects;
- open Work as task or role;
- public Mission / Project / Work reading;
- Work interest;
- explicit email-sharing consent;
- creator invitation;
- human confirmation;
- aggregate public interest/helping counts.

Not live yet:

- Contribution submission;
- Contribution review/recognition;
- MCU issuance;
- public contribution profiles;
- Mission governance;
- payments;
- contracts generated from activity;
- legal equity issuance;
- Mission funding rails;
- secondary trading.

The interface must never present a future rail as already implemented.

## Contribution and ownership

MCUs are the shared language of recognized contribution across 99pct.

A self-reported action is not automatically an MCU-generating Contribution. The system needs an auditable recognition rule and event.

Legal shares, units, options, profit rights, or another legal instrument are a separate ownership ledger. Which instrument exists depends on the Mission's entity and approved legal rules.

MCU totals are not a substitute for issued legal ownership.

Until an authoritative legal issuance exists, 99pct must say that ownership has not been issued rather than estimating or fabricating a percentage.

Each Mission should eventually publish a Contribution Constitution: how work becomes recognized Contribution, how MCUs are calculated, which rule version applied, what evidence supports the recognition, who or what approved it, and how it can be challenged.

## People

99pct is designed for global human participation, subject to applicable law and Mission-specific restrictions.

Verification should be progressive rather than front-loading unnecessary identity friction:

1. Human account — enough to participate in ordinary product actions.
2. Contributor — additional legal identity only when the activity requires an agreement.
3. Paid contributor — tax/payment requirements handled through appropriate providers.
4. Owner/investor — additional checks only when legal ownership or investment requires them.
5. Trader — regulated infrastructure only if secondary trading ever exists.

99pct should not store raw Social Security numbers merely to let a human start or help a Mission.

## Public Mission home

A mature Mission page should eventually answer:

- What are we trying to make real?
- Who is it for?
- What Projects are active?
- What Work needs help now?
- Who is helping?
- What Contribution has been recognized?
- How are MCUs earned?
- What legal ownership, if any, has actually been issued?
- How are decisions made?
- Where does money go?
- What can I do right now?
- What is open source and forkable?

Every displayed figure must come from recorded data.

## Open source and forkability

99pct is not only a website for organizations. It is intended to make the machinery for organizing them open and reusable.

Missions should be able to share software, operating playbooks, contracts, rules, Projects, and Work structures where appropriate, then fork or localize them without asking a central incumbent for permission.

The application source is AGPL-3.0-only unless a file says otherwise. The Missionism protocol/documentation licensing question remains separate.

## Explicitly later

The following are not implied by the current product:

- buying or selling MCUs;
- a securities exchange;
- custody of investment cash;
- seed phrases controlling equity;
- issuing a legal share for every small action;
- arbitrary admin-set ownership percentages;
- guaranteed compensation for open Work;
- automatic legal employment/contractor relationships from participation.

Ordinary investment, if a Mission uses it, remains a separate rail from earned Contribution and ownership.

## Predecessor material

The repository began from a sanitized snapshot of the private Missionism application. That imported application contains Sparks, Pilots, Mission Cells, Mines, Mission Units, Workspace tooling, simulators, and explanatory Missionism pages.

Those are predecessor experiments and research assets.

They may remain available while useful, but they do not define the 99pct product hierarchy or brand.

The 99pct product source of truth is the Mission → Project → Work → Participation → Contribution → MCU loop described here and in accepted ADRs/work orders.
