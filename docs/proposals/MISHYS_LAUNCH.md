# Mishys Launch — Company Compiler Architecture

**Status:** Frozen enough to execute (Proposed product)  
**Maturity:** Proposed · Experimental UX prototype  
**Not Canonical.**  
**Related:** [`mishys-ownership-kernel.md`](./mishys-ownership-kernel.md) · [`OUTCOME_MISSION_UNITS.md`](./OUTCOME_MISSION_UNITS.md) · [`MISHYS_OWNERSHIP_LIQUIDITY.md`](./MISHYS_OWNERSHIP_LIQUIDITY.md) · [`MISHYS_TALENT_OS.md`](./MISHYS_TALENT_OS.md) · [`WHY_NOW.md`](./WHY_NOW.md)  
**Clickable prototype:** `/simulators/mishys-launch`

---

## Freeze line

Treat this architecture as **frozen enough to execute**.

```text
Missionism defines the rules.
Mishys makes them executable.
Legal adapters translate them into jurisdiction-specific reality.
External vendors handle commodity infrastructure.
```

That prevents Missionism from becoming “Delaware PBC philosophy” or Mishys from becoming “another incorporation website.”

**Nothing learned in the three gates reopens this architecture unless it exposes a genuine contradiction.**

UX refinement does **not** reopen the freeze: the legal adapter, MU≠share, and vendor rails stay. What was wrong in v0 of the prototype was jumping straight to **incorporation inputs** instead of compiling existing Missionism machinery into a guided interview first.

---

## Product laws (locked)

### 1. MU ≠ legal share

Finalized Mission Units are the economic source of truth. Legal securities are a settlement layer produced by an adapter.

### 2. The founder chooses intentions. Mishys chooses implementation details.

They should say:

> “I want employees to progressively earn meaningful ownership.”

Not:

> “I want an evergreen 2026 equity incentive plan with RSUs under Rule 701.”

**Apply this law to Missionism itself.** They should choose:

> “More excellent healthcare workers.”

Not invent:

> “Increase the global supply of excellent healthcare workers.”

Mishys knows the `Increase X / Decrease X` convention (`src/content/principles.ts`, `spec/CERTIFICATION.md`). The founder does not need to.

This sentence governs the entire company compiler.

---

## Mental model (corrected)

> **Mishys Launch is not an incorporation questionnaire.**  
> **It is an organizational interview that produces a Missionism company.**

```text
ordinary human answers
        ↓
Missionism compiler   ← mission, arrows, bridge, people, rules
        ↓
legal adapter         ← DE PBC, docs, cap table, bank, payroll
        ↓
vendor rails
```

The first prototype got the **legal compiler** shape right and missed the **Missionism compiler upstream**.

TurboTax metaphor: never ask for adjusted gross income — ask whether they had a job, then a W-2. Same for Launch.

---

## One-line product

> **Mishys Launch = a company compiler.**  
> A founder answers ordinary questions. Mishys compiles a Mission Contract, mission page ingredients, ownership path, governance defaults, legal entity, contributor system, cap table hooks, bank/payroll setup, compliance calendar, and Mission Unit ledger.

The founder should never choose among Rule 701, 409A, 83(b), foreign qualification, PBC report cadence, security type, **or Mission Arrow vocabulary**. The system should know.

**Stripe Atlas lesson:** don't reduce the company to one document — make the founder unaware of how many dependencies are being handled.

---

## Source classification (do not wire blindly)

Existing repo material falls into four buckets. **Do not compile LEGACY into the product.**

| Bucket | Use in Launch | Examples |
|--------|---------------|----------|
| **CURRENT CANONICAL** | Must hold | `spec/canonical.json` — measurableMission, contributorPath, humanConstraints, noPermanentEntitlement, surviveFounder, etc. |
| **CURRENT PROPOSED / EXPERIMENTAL** | Safe defaults / tests | `MISHYS_LAUNCH.md`, MU proposals/kernel, Outcome MU, `MISHYS_TALENT_OS.md`, ownership liquidity (future rail) |
| **USEFUL DESIGN ASSET** | Questions & frameworks; not doctrine | Soft Increase X / Decrease X (`principles.ts`, `CERTIFICATION.md` §1); `MISSION_CONTRACT.md` 7 Qs; Mission Arrows / `/mission` shape in CERTIFICATION; `MISSION_ENTERPRISE_BRIDGE.md` causal stack; `DECISION_COMPILER.md` gates; `ORGANIZATION.md` value layers |
| **LEGACY / CONFLICTING** | Do **not** compile | CERTIFICATION Founder Block “100% committed” / “≤30-year transition” (not in `canonical.json`); older GoPrivate constitution mechanisms; Founder Clock as Protocol requirement |

---

## First milestone (rich organizational package)

```text
YOU'RE STARTING

BENCHMARK


MISSION

Increase the global supply of excellent healthcare workers.


WHAT BETTER MEANS

Excellent worker supply      ↑
Competency                   ↑
Access                       ↑
Readiness speed              ↑
Training burden              ↓
Safety risk                  ↓


YOUR COMPANY

Customer: Healthcare organizations
Problem: Training clinicians takes too much expert time;
         readiness is difficult to verify.
Business: Sell scalable competency training and measurement.
Mission bridge: Better scalable training → more excellent workers → Mission ↑


PEOPLE

Bryan — founder
Future contributors: Progressively earn ownership from lasting value.


RULES

✓ Missionism human constraints
✓ Prospective contribution rules
✓ Mission survives founder
✓ Future contributors retain ownership pathway


MISHYS WILL PREPARE

✓ Mission Contract
✓ Public-benefit language
✓ Mission page ingredients
✓ Contributor ownership system
✓ Initial company structure (US-DE-PBC-CORP v0.1)
✓ Mission Unit ledger
✓ Equity settlement adapter
✓ Governance defaults
✓ Cap table / banking / payroll setup
✓ Compliance schedule


One thing needs your attention:
Sign formation documents.
```

If Mishys can make **that** feel as ordinary as opening a Stripe account, Missionism becomes infrastructure.

---

## Three gates — run in parallel

| Gate | Ask | Deliverable |
|------|-----|-------------|
| **1. Counsel** | Smallest legally workable `US-DE-PBC-CORP v0.1` | Exactly how `finalized MU → contributor equity award` works across founder stock, options, RSUs, Rule 701, evergreen reserves, financing, exits |
| **2. Clerky + Carta** | Where APIs stop | Capability matrix: `native / API / manual handoff / unsupported` for PBC formation, custom charter, founder stock, equity plan, grant creation, cap-table sync |
| **3. Founder prototype** | Can someone finish without knowing Missionism theory **or** corporate law? | Guided organizational interview → mocked Missionism + legal package — no Firebase, no real filing API, no securities logic |

Prototype pass condition:

> “I entered what I care about, and a correct company came out the other end.”

Not:

> “I understand Missionism theory.” / “I know how to write Increase X.”

---

## Five human phases (not an incorporation wizard)

| Phase | Mishys asks (ordinary English) | Mishys secretly creates |
|-------|--------------------------------|-------------------------|
| **1. Your mission** | More or less of what? Who / where? What would success look like? Who benefits? Who could be worse off? | Mission statement (`Increase`/`Decrease`), Mission Arrows, first Mission Contract fields |
| **2. Your company** | What are you building? Who pays? Why do they care? How does that help the mission? | Enterprise / customer problem, Mission Bridge sketch |
| **3. Your people** | Who is starting? How should future builders participate? | Founders, contributor path, starting ownership intent, MU defaults |
| **4. Your rules** | What must never be sacrificed? (defaults on) | Human constraints, prospective-policy + survive-founder defaults |
| **5. Make it real** | Where? Funding plans? Confirm. | Legal adapter, PBC benefit, capitalization, compliance, company package |

Fewer concepts per screen. ~15 simple answers → ~30 sophisticated artifacts.

### Mission construction (TurboTax pattern)

Never hand a blank “Mission” textarea as the primary UX.

```text
What do you want the world to have MORE or LESS of?
  ○ More of something
  ○ Less of something

More of what?
  [ excellent healthcare workers ]

Who or where?
  ○ Everyone / global
  ○ A specific group
  ○ A specific place

→ We'd write your mission as:
  Increase the global supply of excellent healthcare workers.
  [Looks right] [Make it more specific]
```

### What better means (arrows without the word “arrows”)

```text
If this mission were succeeding, what would you expect to see?
☑ More people available  ☑ Better quality  ☑ Faster readiness …
```

Mishys compiles directional ↑ / ↓ statements. Propose a Value Equation later — not on day-one screens.

### Business ↔ Mission bridge (without the diagram)

```text
What are you starting with?  Who pays you?  Why would they pay?
```

Compile: customer · problem · business · mission bridge. Optimize the business to fund the Mission; optimize the Mission to decide what businesses should exist (`docs/MISSION_ENTERPRISE_BRIDGE.md` — useful design asset).

---

## Design philosophy

| Do | Don't |
|----|-------|
| Guide intentions into Missionism artifacts | Hand blank theory fields |
| Hide dependency graphs | Ask founders to learn Delaware law **or** Missionism ontology |
| Ship a safe Missionism default profile | Require solving persistence theory before incorporation |
| Keep fundraising paperwork conventional | Invent a novel “Mission SAFE” on day one |
| Own the Missionism + legal compilers | Recreate formation/cap-table/payroll rails |
| Treat MU as economic source of truth | Mint a legal share on every MU award |
| Use legal adapters per jurisdiction | Bake Delaware into Canonical Missionism |
| Classify legacy before wiring | Compile CERTIFICATION Founder Block timelines as Canonical |

Personality of the product (from the public site):

> We come in peace. We're not asking capitalism to stop optimizing. We're asking it to optimize a better-aligned game.

---

## Hard architectural invariant

```text
MISSIONISM ECONOMIC LAYER

raw facts
→ contribution / outcomes
→ Mission Units
→ finalized contribution ledger


LEGAL ADAPTER

finalized MU
→ appropriate legal award
→ board approval
→ securities compliance
→ cap table
```

**MU ≠ legal security.**

User sees:

> You earned 18,440 Mission Units this period. Your ownership award is being prepared.

Not:

> Choose ISO vs NSO vs RSA vs RSU.

---

## Protocol vs adapter

```text
Missionism Protocol
        ↓
Mishys (compiler / operating system)
        ↓
Legal adapters

US-DE-PBC-CORP     ← default v0.1 recommendation
US-DE-CORP
US-DE-PB-LLC
US-Purpose-Trust / EOT (later-life / succession)
UK-Ltd / EOT
Worker Cooperative
Germany steward-ownership patterns
...
```

Missionism must survive changes in corporate law. Adapters are versioned products, not Canonical claims.

---

## First legal adapter: Delaware PBC (recommended default)

**Not because a PBC *is* Missionism.** Because it is an unusually good chassis.

Under Delaware law, a public benefit corporation:

- states one or more **specific public benefits** in its charter;
- requires directors to **balance** stockholder pecuniary interests, interests of those materially affected by the corporation's conduct, and the stated public benefit(s) ([DGCL § 365](https://delcode.delaware.gov/title8/c001/sc15/));
- must provide stockholders a **benefit statement at least biennially** describing objectives, standards, factual information, and assessment ([DGCL § 366](https://delcode.delaware.gov/title8/c001/sc15/)).

Mapping:

| Missionism | Delaware PBC |
|------------|--------------|
| measurable mission | specific public benefit |
| mission value / outcomes | objectives + standards + assessment |
| customers / contributors / community | materially affected stakeholders |
| profit is fuel | stockholder pecuniary interests still matter |
| mission review | PBC benefit reporting |

PBC remains a **for-profit** Delaware corporation — not a nonprofit.

**Default product profile:** `Mishys Standard US Startup v0.1` → Delaware Public Benefit C Corporation.

### Research caveat — Clerky Partner API

- Clerky's **product** supports Delaware PBC formation end-to-end.
- Clerky's public **Partner API** currently documents **Delaware C-Corporation formations only** ([developers.clerky.com](https://developers.clerky.com/)).

**Action:** before building production rails, ask Clerky whether Partner API can expose PBC + post-incorporation packages.

---

## Growing pie ↔ evergreen legal reserve

Missionism innovation is **who earns** replenished slices and **why**, not inventing the existence of a replenishing pool.

Counsel question:

> Can we build a Missionism Contributor Equity Plan with an evergreen reserve whose replenishment is bounded by a prospectively defined Missionism policy?

---

## Build vs buy

| Layer | Mishys owns | First rail to investigate |
|-------|-------------|---------------------------|
| Organizational interview + Missionism compiler | **Entirely Mishys** | This prototype |
| Formation UX + state machine | Yes | **Clerky Partner API** (confirm PBC / post-incorporation access) |
| Missionism legal docs | Versioned parameters + workflow | Startup counsel Missionism document pack |
| Corporate form | Mission → adapter selection | Delaware PBC initially |
| Contribution / MU | **Entirely Mishys** | Outcome scorecards, ledgers, epochs |
| Legal equity translation | Grant instructions from finalized MU | Counsel-approved adapter |
| Cap table | Sync settled securities | **Carta Launch / Launch API** |
| Banking | Prefill + status | **Brex Onboarding**; Mercury affiliate as alt |
| Payroll / HR | Contributor identity + comp sync | **Gusto Embedded** |
| Fundraising | Missionism disclosure + dilution envelope | Standard YC-style SAFEs / priced rounds |
| Compliance | Dependency engine + “one next action” | Mishys + provider rails |

Formation is becoming commodity infrastructure. **Monetize the 50-year operating system, not incorporation markup.**

---

## Safe default profile (do not block on theory)

```text
Mishys Standard v0.1
Experimental

Mission                  defined (Increase/Decrease compiled)
Mission arrows           from success checklist
Mission bridge           from company interview
Human constraints        Missionism defaults (Canonical)
Founder capitalization   standard
Contribution ledger      enabled
MU settlement            every 6 months (or policy default)
Contributor pool         enabled
Governance               standard board + survive-founder default
Persistence              current experimental default
Fork/export              always available
```

---

## Fundraising: stay boring

Prefer standard YC-style SAFEs / conventional priced rounds + one-page Missionism Ownership Policy disclosure.

---

## Compliance as a compiler

```text
company facts + jurisdiction + employees + fundraising + securities + current law
        ↓
required actions → “One thing needs your attention.”
```

---

## After launch: the real product

Atlas answers: *How do I create the legal shell?*  
Mishys answers: *How do I run this institution for the next 100 years?*

Formation at cost or near-cost. Monetize continuing Missionism administration.

Post-formation OS: [`MISHYS_TALENT_OS.md`](./MISHYS_TALENT_OS.md).

**Future Ownership capability (not Launch scope):** “Use your ownership” — see [`MISHYS_OWNERSHIP_LIQUIDITY.md`](./MISHYS_OWNERSHIP_LIQUIDITY.md). Does **not** reopen the frozen compiler architecture.

---

## Architecture summary

```text
Missionism is the protocol.
Mishys is the organizational + legal compiler.
Delaware PBC is the first legal adapter.
Clerky / Carta / Gusto / Brex are rails.
Mission Units are the economic source of truth.
Standard legal securities are the settlement layer.
Ownership Liquidity is a future rail (external capital partners).
```

---

## Open product questions

- Can Partner-API formation be PBC-native, or is election/conversion required?
- What is the minimal safe contributor plan for companies with 1–3 founders and $0 raised?
- When does MU→legal settlement run (each epoch vs batched annually)?
- How does Certification inspect OWNERSHIP / AGENCY / ALIGNMENT without importing LEGACY Founder Block timelines?
- International founders: which non-US adapters ship second?

---

## Sources (research notes)

- Clerky Partner API: Delaware C-corp formations ([developers.clerky.com](https://developers.clerky.com/))
- Clerky PBC product: [clerky.com/public-benefit-corporations](https://www.clerky.com/public-benefit-corporations)
- Delaware PBC: DGCL §§ 365–366
- Carta Launch API / Atlas: [carta.com/api](https://carta.com/api/)
- Gusto Embedded: [docs.gusto.com/embedded-payroll](https://docs.gusto.com/embedded-payroll/docs/onboard-a-company)
- Brex Onboarding: [developer.brex.com/onboarding/referrals](https://developer.brex.com/onboarding/referrals)

*Legal/regulatory claims must be verified with counsel before product promises. This document is architecture, not legal advice.*
