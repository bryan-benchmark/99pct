# MISSION_UNITS_V0.2 — Persistence & Dual-Pool Experiment

**Status:** Proposed  
**Maturity:** Proposed / Experimental  
**Not Canonical.**  
**Supersedes for experimentation:** parts of [`MISSION_UNITS_V0.1.md`](./MISSION_UNITS_V0.1.md) economic-ownership formula  
**Last updated:** September 2026

---

## What v0.1 falsified

Treating this identity as true:

> historical contribution = permanent claim on **all** future value

Produced the 100-year result: **active ~20% / historical ~80%**.

Also: **nominal dollar MU partly measures currency deterioration**, not contribution (nominal early 35.6% vs late 64.4%; real 50/50).

---

## Locked questions

1. Must historical contribution remain immutable? **Hypothesis: yes (MU ledger).**
2. Must historical contribution retain identical economic power forever? **v0.1 evidence: probably no.**
3. Can immutable MU + derived persistence-weighted weight produce stable long-run ownership without confiscation?
4. Does exponential persistence behave better than permanent, linear, or cliff-expiration?
5. What emerges across 2 / 10 / 50 / 100-year institutions?
6. Can inheritance preserve lineage without accumulating control over future contributors?
7. Normalize labor reference values into constant purchasing-power before minting MU (**promote toward kernel requirement**).
8. Governance weight is **not** assumed equal to economic weight (document only; do not design chambers yet).

---

## Conceptual target sentence

> **Missionism remembers contribution forever without allowing the past to own the future forever.**

Both instincts can be true: grandfather's work matters forever as **credit**; it should not give descendants large claims on people working there in 2130.

---

## Architecture under test

### Layer A — Permanent historical ledger

```text
CONTRIBUTION → REAL MU (immutable)
"What did you contribute historically?"
```

MU are never decayed or deleted. Corrections remain REVERSAL + replacement.

### Layer B — Derived economic force (experiment)

```text
EMU = MU × persistence(age_of_units)
Economic weight = EMU_i / Σ EMU
```

Or dual-pool variant:

```text
Distributable economics = Current Pool + Legacy Pool
Current Pool  → recent contribution (majority; experimental %)
Legacy Pool   → all historical real-MU (permanent minority; experimental %)
```

**Do not lock 85/15 yet.** Sweep pool splits as parameters.

### Layer C — Governance (out of scope for this cut)

Current stewardship ≠ economics ≠ historical record. Document only.

### Layer D — Mission Security (future)

Diversified retirement across missions — conceptual separation only; do not build.

---

## Persistence models to torture (universal curve first)

| Model | Rule |
|-------|------|
| **Permanent** | persistence = 1 forever (v0.1 baseline) |
| **Hard expiration** | force for X years, then 0 |
| **Linear decline** | force declines evenly to 0 over X years |
| **Exponential** | half-life H years: `0.5^(age/H)` |

Exponential sweep: **2, 5, 10, 20, 40** year half-lives.

Do **not** implement type-specific persistence yet (labor vs cash vs succession). Preserve the possibility.

Do **not** ask “which makes Bryan look fair?” Ask which behavior stays coherent under radical org/timescale variation.

---

## Killer chart

For a 100-year institution, show **% of economics by contribution age**:

```text
0–5 · 5–10 · 10–20 · 20–40 · 40+ years
```

under each persistence / pool policy. That is the institution's **memory**.

---

## Real MU

Store evidence in nominal currency; mint MU from a defined constant-value basis (base year + price index assumption). Test CPI-like constant inflation assumptions in the simulator; do not hardcode a forever index choice into doctrine yet.

---

## Separation of powers (document for later product)

Constitution · Rulemaking · Measurement · Mint · Court · Audit · Amendment — different permissions; software-enforceable in small orgs. Dual chambers (contributor + stewardship) for **system** changes only — never vote Alice's MU. Legacy holders keep property rights, not managerial authority after exit.

Amendment sequence (future): proposal → simulation → adversarial audit → blind review → dual consent → cooling → prospective activation → sunset experiments.

---

## Meritocracy (working definition)

> Economic power should follow demonstrable contribution under rules established before the outcome was known, with explicit treatment of uncertainty, luck, risk, and measurement error.

---

## Success for this cut

Simulator can compare permanent vs cliff vs linear vs exponential (and optional current/legacy pools) on the same scenarios, with real MU, age-band charts, and invariants:

- MU totals never silently shrink (except via REVERSAL)
- EMU is always a pure function of MU + policy
- Permanent model reproduces v0.1 economics
- Real mode removes pure-inflation ownership shift for equal real careers
