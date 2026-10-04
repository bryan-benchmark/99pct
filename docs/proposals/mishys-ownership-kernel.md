# Mishys Ownership Kernel — Mission Units

**Status:** Proposed product direction for Mishys · Experimental mechanism for Missionism  
**Protocol version:** adjacent to Missionism Protocol v0.1  
**Last updated:** September 2026  
**Maturity:** Proposed (product) · Experimental (economic mechanism)  
**Not Canonical.** Do not present as Missionism Core.

Related:

- Claim `contributorPath` in [`spec/canonical.json`](../../spec/canonical.json)
- Protocol accounting notes: [`spec/MCU_PROTOCOL.md`](../../spec/MCU_PROTOCOL.md)
- Future liquidity rail (not lending): [`MISHYS_OWNERSHIP_LIQUIDITY.md`](./MISHYS_OWNERSHIP_LIQUIDITY.md)
- Naming reconciliation with **MCU** is **Open** (see below)

---

## Mental model

> **Slicing Pie tracks at-risk contributions until the pie “bakes.”  
> Missionism tracks mission contribution forever, and the pie never has to bake.**

Slicing Pie proves a useful UX pattern: log contributions → convert to units → ownership % recalculates → approvals → predefined departure treatment.

Missionism needs one additional primitive Slicing Pie intentionally does not solve:

> Fully paid people still progressively earn ownership, because ownership is about stewardship and contribution—not merely compensation for startup risk.

---

## The engine

```text
                    MISSION
          What are we trying to accomplish?
                         │
                         ▼
                 CONTRIBUTIONS
      work · cash · IP · sales · outcomes
                         │
                         ▼
                  MISSION UNITS
                immutable ledger
                         │
                         ▼
              CURRENT OWNERSHIP
                  (units_i / Σ units)
                         │
                  new work happens
                         │
                         ▼
              OWNERSHIP RECALCULATES
```

Nobody’s old units disappear. The denominator grows. That is perpetual dilution by creation—not confiscation.

### Core formula (start here)

Do **not** start with a giant multi-factor “AI impact” equation.

\[
MU = ReferenceValue × ContributionMultiplier
\]

\[
Ownership_i = \frac{MU_i}{\sum MU}
\]

### Ledger event shape

```text
Contributor: Alice
Mission: Benchmark
Date: Sept 24, 2026
Contribution: Product engineering
Reference value: $1,800
Contribution class: Labor
Multiplier: 1.0
Evidence: GitHub + payroll
Units earned: 1,800 MU
Status: Final
```

---

## Contribution classes (v0 sketch)

| Contribution | Example reference value | Possible treatment |
|---|---:|---|
| Labor | market compensation | 1× |
| Underpaid labor | uncompensated market gap | additional risk premium |
| Cash | dollars at risk | higher risk multiplier |
| IP / assets | agreed fair value | configurable |
| Revenue creation | realized economic value | predefined rule |
| Exceptional mission outcome | measured outcome | separate **bounded** bonus pool |

### Critical Missionism departure

Market-rate salary does **not** reduce labor units to zero.

- Alice creates ~$150k/year of normal contribution and is paid $150k → **cash + Mission Units**.
- Bob does ~$150k of contribution but takes $50k cash → normal Mission Units **plus** an at-risk premium.

Separation of concerns:

| Question | Answered by |
|----------|-------------|
| How much did we compensate you now? | Money |
| How much of this institution did you help create? | Mission Units |

---

## Autonomy (product principle)

Prefer observing work where it already happens over timesheets.

```text
Payroll · GitHub · CRM · Stripe · project trackers · outcomes
Manual claims · manager/peer input (bounded)
        → Contribution Engine → Mission Units → Ownership ledger
```

Target employee experience (monthly):

```text
August contribution
Compensation value: $12,500
Normal Mission Units: 12,500
Outcome bonus: 1,800
At-risk contribution: 0
Total: 14,300 MU

Your ownership: 0.84% → 0.87%
[See why]
```

Dispute window. No employee self-scoring of “how awesome I was.”

---

## MVP loop (six screens)

```text
Mission · People · Contribution Rules · Activity · Ownership · Agreement
```

1. Create Mission (mission, rules, classes, reference rates, initial people).
2. Connect evidence (payroll + manual first).
3. Generate contribution events (payroll cycle → labor; cash → capital; etc.).
4. Approval / dispute (boring entries auto-approve; high-value need a second human).
5. Finalize epoch (monthly; then append-only).
6. Recalculate ownership (`your units / all units`).
7. Departure: stop new units; retain earned units per exit policy; % dilutes as others earn.
8. Legal settlement is **separate**: export a settlement report; legal adapters map to C-corp / LLC / coop / nonprofit later.

```text
Mishys ledger = economic truth under the Missionism agreement
Legal cap table = legal implementation of that agreement
```

Do **not** build a full cap-table company inside Mishys v1.

---

## Oracle problem (design constraint)

Who decides what a contribution was worth?

Principle:

> **80–90% of ownership should be boring and deterministic.**  
> AI should identify and explain contributions. It should not have unconstrained authority to manufacture ownership.

Humans set rules **before** outcomes. Mishys executes them. Exceptional outcome credits are small, bounded, and auditable.

---

## Extensions that reuse the same primitive

### Succession (experimental rule sketch)

Successful transfer of responsibility can mint additional units (institution creates value), e.g.:

```text
Succession pool = 5% of successor’s first 24 months of earned units
Successor: 100% of their normal units
Predecessor: additional succession units (not taken from successor’s grant)
```

Optional decaying “grandparent” credits across generations are **experiments**, not doctrine.

### Recursive missions

A contributor need not be a human. A **mission can own Mission Units in a parent mission.**

```text
Improve Human Health
        ← MU from —
Healthcare Workforce
        ← MU from —
Benchmark
   /    |    \
Founder A   Contributor A   Contributor B
```

Same ledger primitive: people → teams → companies → missions → larger missions.

---

## Naming: MU vs MCU (**Open**)

Protocol docs already use **MCU** (Mission Contribution Unit). This proposal uses **Mission Unit (MU)** for product clarity.

Until reconciled:

- Do not treat “MU” and “MCU” as two competing Canonical terms.
- Prefer: one contribution-accounting primitive; Mishys product language may simplify naming later with a `/changes` entry if elevated.

---

## What this is not

- Not social networking, mission marketplace, or governance voting (those may come later).
- Not continuous automatic legal share issuance.
- Not Canonical Missionism Core.
- Not a requirement that every Missionism-compatible org use Mishys.

## Success test

If after ~six months a real mission’s ownership feels **obviously fair** without anyone opening Excel—add people, record cash, mark departure, keep evolving—the kernel works.

**Missionism’s 10× is not a better Slicing Pie calculator.** It is contribution-led ownership that never bakes, works for fully compensated people, mostly observes contribution automatically, survives departures, and recursively connects organizations to larger missions.
