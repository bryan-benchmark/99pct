# Product Constitution

## Meta-rule

Missionism (protocol): design companies so contributor, company, and customer self-interest align — [`spec/canonical.json`](./spec/canonical.json) · [`spec/CORE.md`](./spec/CORE.md).

Mishys is not optimized to maximize engagement. It is optimized to maximize meaningful collaborative outcomes and contributor ownership.

When choosing between a feature that creates more scrolling and a feature that gets someone closer to useful contribution, always choose contribution.

**Do not build the civilization operating system first.** Build the loop that gets a stranger to one useful action.

## Product north star

Three clean layers:

| Layer | Role |
|-------|------|
| **Missionism** | Open protocol — GitHub for coordinated human effort. Spec in `/spec`. Forkable. Not owned by Mishys. |
| **Mishys** | Opinionated implementation — the **market for missions** / SAFE defaults. Reads `/mission.json`; never the source of truth. |
| **Missions** | The actual work — independent communities. |

**Brand philosophy:** Missionism defines what is possible. Mishys makes discovery and defaults easy.  
**Don’t start from scratch. Start from what works.**  
Mishys is opinionated but **never authoritative**. If Mishys fails, Missionism survives. **No pay-to-rank.**

Homepage split:

- **missionism.com** — Constitution + protocol. How it works · Fork it · Improve it.  
- **mishys.com** — Find something worth working on. Find my Mission. Start this mission.

**Category:** Market for missions (Needs / constraints) — not a job title board. See [`spec/MISHYS.md`](./spec/MISHYS.md).
**SAFE analogy:** Enormous complexity underneath; participant path is click → Mission → team → useful thing today.  
**Defaults:** Simplest currently known reasonable way—not “the correct way.” Update defaults when evidence says so (organizational primitives library).  
**Consumer description:** A feed of things worth doing — and a marketplace where missions publish needs and people offer skills, capital, and work.  
**Conversion question:** Do I care about this Mission, and do I want to spend my time with these people?  
**North-star match:** Given who I am, what I care about, what I’m capable of, what I want to become, who I enjoy working with, the time/resources I have, and what the world needs—where can I create the most value next?  
**Match model:** Mission × Role × Team × Time × Economic × Growth fit — dimensional reasons, not opaque %.  
**Atomic object:** Opportunity (minutes → career) with first-class team strip + People tab. Never optimize for click probability.  
**Governance UX:** Pull-request style proposals with evidence—not 👍/👎 contests. Fork as ultimate check (reasoning copies; economic claims do not automatically).

### Unit of organization (reversed)

Traditional: company has position → find human.  
Missionism: world has problem → desired outcome → constraints → work → complementary humans/resources → prove progress → distribute created value.

## The Human Compact (beneath Missionism)

Non-forkable human floor at `/compact` and `spec/HUMAN_COMPACT.md`: equal human worth · freedom of conscience · nonviolence/non-coercion · ideas challengeable, people retain dignity · reciprocity.

**Core law:** People aren’t the problem. Problems are the problem. Fix the system, not the human. Accountability asks what must change; blame asks whom we should hate. Agency and consequences remain—don’t confuse a person with the problem.

Radically pluralistic about Mission ends; non-pluralistic about conditions for working together. Belonging = behavior toward humans, not ideological conformity. Fork almost anything—not this.

## Globals (physics)

Twelve durable principles at `/globals`: Mission, Truth, Positive Sum, Collaboration, Contribution, Long Term, Autonomy, Transparency, Proof, Stewardship, Do No Hidden Harm, Evolution.

MCUs, Cells, Councils, and Slicing Pie are technologies—not Globals. You should not be able to create a Mission that violates the Compact or the Globals.

Anti-degeneration mechanisms (Contract, lineage, fork, calibration, reputation vectors, opportunity cost, “don’t join,” Unknowns, sunset, economics≠governance, etc.): `/mechanisms`.

## Primary activation KPI

**Visitor → first meaningful contribution.**

Target eventually: **&lt;10 minutes** stranger → useful action.

First product almost entirely:

> Care about → about yourself → 3 matches → choose one → complete one small Mine → Proof / MCU.

Until that loop works, governance, voting, portfolios, lending against ownership, and elaborate product constitutions are mostly theoretical. Obsess over **time-to-first-contribution**.

### Secondary KPIs

- time to first useful contribution
- join → first contribution rate
- mine completion / proof acceptance / repeat contribution
- team formation / collaborator rate
- first-time owners created
- median ownership earned through labor
- contributor-owned value (COV) created
- unlocks enabled / bad ideas killed (information value)
- referral rate after first successful Mine

### Do not optimize

Raw time-on-site, comment volume, addictive scrolling, MCU speculation, conversion-at-all-costs.

## Mishys meta-equation

**Human Potential Activated** ≈  
(Meaningful Contribution × Mission Value × Person Fit × Fair Participation × Durability)  
/ (Time + Friction + Harm)

## Three core loops (build these first)

1. **Discovery:** see interesting Mission → join → follow → return  
2. **Contribution:** join Mission → find Mine → contribute → Proof → reputation/MCU  
3. **Recruitment:** team needs skill → posts Need → Mishy shares/recruits → person joins → team gets better  

Funnel: See → Care → Join → Contribute → Prove → Own → Return → Recruit

## Positive-sum Collaboration

Don’t fight over the pie until you’ve tried to make the pie bigger.

Missionism is positive-sum. Seek solutions where the Mission advances and contributors become better off. Major disputes require a **Positive-Sum Search** before tradeoff adjudication.

MCUs reward **net Mission contribution** (Direct + carefully attributed Enabled), not local KPI maximization. Negative results and killed hypotheses can earn MCUs—information value.

## Mission Contract (admission)

Before a Mission is admitted, answer:

1. What world state are we trying to create?  
2. How will we know we’re getting closer?  
3. Who benefits?  
4. Who could be harmed?  
5. What do we currently believe drives the outcome?  
6. What evidence would make us change our minds?  
7. How is created value shared?  

## Mine types

| Type | Purpose |
|------|---------|
| Outcome Mine | Make X true (with parent/sibling guardrails) |
| Learning Mine | Resolve whether X is true (failed hypothesis can still pay) |
| Unlock Mine | Remove a constraint that improves multiple nodes — often highest value |

Mines carry dependency edges: blocks / blocked by / unlocks. Unknowns are first-class objects.

## Belief · prediction · result

Before work: lock belief (and optional numeric prediction). After: actual. Calibration trains judgment profiles for matching.

## Universal object model

User/Mishy · Mission · MissionContract · MissionNode · PerfectWorldState · ValueEquation (Mission | Enterprise | Customer | Option) · Variable · Constraint · Unknown · Mine (Outcome | Learning | Unlock × Enterprise | Mission | Bridge) · Proof · Experiment · MissionMemo · Team/Cell · Organization · StrategicPortfolio · MissionReinvestment · DisruptUsProgram · ProductBridge · ContributionAgreement · MCUEntry · Decision · Proposal/MIP · ConstitutionVersion · ReputationVector · Post · Comment · Need/Role · ResourceOffer · MissionPortfolio · Lineage/Fork

Every important object: `id`, `title`, `description`, `parent_id`, `status`, `created_by`, `created_at`, `version`, `visibility`, `evidence_links`, `discussion_thread`, `change_history`.

**Version from day one. Fork when serious disagreement persists.** MCU ≠ legal share. Never hard-code `1 MCU = X shares`.

## Rights separation

Separate (overlap, not identity): **economic rights** · **operational authority** · **constitutional governance**. Historical MCU wealth must not automatically control Mission meaning.

## AI

Copilot for structure and match explanations. May recommend **don’t join**. Never: issue MCUs, certify high-stakes Proofs alone, rewrite Constitution, unilaterally value ownership, collapse reputation to one score.

Matching eventually includes opportunity cost: Expected Mission Value / scarce human capability consumed. Prefer comparative advantage and unusual intersections.

## Reputation

Never one global score. Vector dimensions (e.g. Execution, Domain, Prediction accuracy, Collaboration, Technical, Reliability, Teaching). No globally “best Mishy.”

## Sunset

Missions periodically choose: Continue · Redefine · Merge · Split · Mission accomplished · Terminate. Prestige for completion, not immortality.

## Cold start

Mission states: Draft → Incubating → Active → Established → (Accomplished | Terminated | Merged). Explore only after quality thresholds (Contract, Perfect World, Equation, steward, Mine, activity). No cemetery Missions.

## Build phases (preserve order)

Full plan (Experience Leverage, five larger equation shifts, AI Insight Value, Benchmark + horizon tracks): **`BUILD_PLAN.md`**.

0. **Activation loop** — care → profile → 3 matches → one Mine → Proof/MCU (&lt;10 min path)  
1. Mission discovery + join + feed of things worth doing  
2. Mines + Needs + teams + team strips / People tab  
3. Structured Proofs + belief/prediction lock + reputation vectors  
4. Contribution agreements + MCU ledger (direct + careful enablement)  
5. Value Equation builder + Mission Graph + lineage + forks + Unknowns  
6. Organization formation + legal equity mappings + rights separation  
7. Capital/resource marketplace, portfolios, liquidity, sunsets  

Stop after phase 4 until the three loops work. Do not jump to finance.

### AI / Experience Leverage (product principle)

AI collapses cost of unstructured → structured. Value migrates to Experience + Truth + Judgment + Trust + Action + Coordination + Accountability.

Benchmark lab optimizes **Experience Leverage** (wisdom transferred / expert effort × error)—not “better scenario builder.”  
AI collaboration optimizes **expected change in decision quality**—not answer polish.  
Shared pipeline: messy signal → structure → grounding → decision → action → measurement → compounding.

### Mission ↔ Enterprise (constitutional)

**Optimize the business to fund the Mission. Optimize the Mission to decide what businesses should exist.**

Separate equations: Mission Value (solution-agnostic) · Enterprise Value (economic engine) · Customer/Product Value (local, under Mission guardrails) · Option Value (future paths). Every product: Mission/Enterprise/Option scores + explicit causal Mission bridge. Portfolio 2×2 + Disrupt Us + Mission Reinvestment. Mines: Enterprise · Mission · Bridge. Products are hypotheses—never constitutionally protected. Full: `docs/MISSION_ENTERPRISE_BRIDGE.md`, `spec/ORGANIZATION.md`.

### Mission-aligned pricing (lab / enterprise)

**Mission determines what we subsidize. Value determines what we charge.**

Never make the mission more expensive simply because it is succeeding. Abundance (practice, excellent contribution) free/cheap; coordination, trust, governance, customization, service, enterprise infrastructure paid. Transparent ≠ cost-plus. Do not undercharge enterprise “for the mission.” Full doctrine: `docs/MISSION_ALIGNED_PRICING.md`.

### Useful contributor ownership (constitutional, not yet product)

**A paycheck pays for today. Ownership should help pay for tomorrow.**

Salary for today + Contributor Shares for decades + financial infrastructure that makes private ownership usable (hold / windowed liquidity / conservative financing). Private is the intended destination so the mission stays the highest-order scoreboard; public Capital Shares remain an escape hatch. Never treat IPO as graduation. Wealth can be inherited; permanent political control should not automatically be inherited. Capital can buy economics; it cannot simply buy the mission. One-way conversion Contributor → Capital. Accept a governance discount if smaller than the value of protected mission control. Do not build a company town. Design against the recession run (no ordinary mark-to-market margin loans for core life needs; several liquidity sources; cap company repurchases). Partner with regulated institutions first. Lending against ownership is Phase 7—do not ship it before the activation loop. Full system: `docs/OWNERSHIP_AND_CAPITAL_SYSTEM.md`. Promise: `docs/OWNERSHIP_THAT_CHANGES_LIVES.md`. Spec: `spec/OWNERSHIP.md`. Site: `/ownership`.

### Founder Clock + marketplace (constitutional)

**Time makes equity available. Mission progress unlocks it. Contribution earns it.**

A Founder Clock (test ~20–30 years) is committed when the pie is still worth little. Original founder ownership becomes available on a published schedule, unlocked by Mission progress, earned by contribution. Not a calendar giveaway. Choosing cash never means you believe in the Mission less (safe voluntary mix, e.g. ≤20–30% of pay into extra equity). Earned equity stays yours if you leave.

**People do not belong to Missions. Their contributions do.** Mishys is a coordination market: people have skills and personal missions; Missions have needs; work is paid in cash, equity, or both. A person can mine small slices across many pies. Full explainer: `docs/MISSIONISM.md`. Site: `/system`.
