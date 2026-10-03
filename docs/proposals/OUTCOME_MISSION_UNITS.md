# OUTCOME_MISSION_UNITS — Hours as Reference, Outcomes as Credit

**Status:** Proposed  
**Maturity:** Experimental  
**Not Canonical.**  
**Related:** [`MISSION_UNITS_V0.1.md`](./MISSION_UNITS_V0.1.md) · [`MISSION_UNITS_V0.2.md`](./MISSION_UNITS_V0.2.md)

---

## Fundamental change from naive labor MU

**Do not pay equity for hours.**

Hours (or FTE-equivalent capacity × market rate) establish only the **fair-market reference value of the role for a period**.

**Mission Units are minted from prospectively agreed outcomes**, scaled against that reference.

```text
RAW FACTS
  revenue dollars · QBP counts · milestone level achieved
        ↓
VERSIONED SCORECARD POLICY
  targets · weights · per-KPI attainment caps · acceptance levels
        ↓
SYSTEM CALCULATES ATTAINMENT
        ↓
Weighted score (per-KPI cap → then overall scoreCap)
        ↓
Outcome-adjusted contribution value
        ↓
Normal MU  (+ at-risk MU if guaranteed cash < that value)
```

**Nobody types a performance percentage.** Attainment is a calculated output.

Cash commissions remain a **separate transaction reward** (uncapped).  
MU remain **institution-building credit** (bounded per evaluation period).

---

## Locked principles for this experiment

1. **Hours are not prospective MU.** Hours may be used once for historical import and ongoing only as reference-value calibration.
2. **≤3 compensated KPIs** per mission scorecard. Additional measures dilute focus.
3. **KAIs instrument; they do not compensate.** Posts, DMs, meetings explain KPI movement; they do not mint MU.
4. **Targets, weights, and definitions are prospective.** No post-hoc goalpost moves.
5. **Attribution is prospective.** Source/owner recorded while the opportunity is live.
6. **Cash commission uncapped; MU performance multiplier capped** (pilot: 200% per KPI before weight, then overall scoreCap).
7. **Guaranteed / base role cash offsets risk only** — not contingent commissions. Payment timing of commissions must not change ownership.
8. **Separate missions = separate scorecards and ledgers** (e.g. Benchmark vs GoPrivate).
9. **Company blockers documented**, not silently treated as individual failure.
10. **Disputes are factual** under prior rules — not “I feel I contributed more.”
11. **No free-mint attainment input.** Runtime input is observable facts; the system derives attainment from a versioned policy.

---

## Per-KPI and overall caps

Each KPI’s attainment is capped **before** weighting (pilot: 200%).

```text
Economic growth max weighted contribution = 2.0 × 50% = 100 points
QBP max                                   = 2.0 × 30% =  60
Growth leverage max                       = 2.0 × 20% =  40
```

Extraordinary performance on one dimension can reach **100% of target contribution by itself**. Getting **above target** requires value in multiple dimensions.

There are **no mandatory minimums** across every KPI (bureaucracy). Exceptional performance may substitute somewhat — but not infinitely.

Overall `scoreCap` (pilot: 200%) applies secondarily.

---

## At-risk formula (pilot)

```text
Normal MU     = outcomeAdjustedContributionValue × laborMultiplier   (usually 1)
Uncompensated = max(0, outcomeAdjustedContributionValue − guaranteedRoleCash)
At-risk MU    = uncompensated × (atRiskLaborMultiplier − laborMultiplier)
Total MU      = Normal MU + At-risk MU
```

**guaranteedRoleCash** = salary / retainer / base compensation committed prospectively for the role.

**Contingent sales commission does not enter this formula.** Commission rewards winning transactions; at-risk MU rewards working without a guaranteed paycheck. Each mechanism has one job.

With laborMultiplier=1, atRiskLaborMultiplier=2, and guaranteedRoleCash=0:

```text
Outcome value     12,187.50
Guaranteed cash        0
Normal MU         12,187.50
At-risk MU        12,187.50
Total             24,375.00
PLUS whatever cash commission was earned independently
```

If the company later pays a $5,000/quarter retainer:

```text
Outcome value     12,187.50
Guaranteed cash    5,000.00
Normal MU         12,187.50
At-risk MU         7,187.50
Total             19,375.00
```

MU never create a cash payable balance.

---

## Reproducibility invariant

Every Mission Unit must be reproducible from:

```text
raw facts
→ policy version
→ deterministic KPI attainment
→ weighted score
→ reference contribution
→ risk treatment
→ Mission Units
```

There must be **no editable human-entered number** anywhere in that chain whose sole meaning is “how valuable we thought this person was.”

---

## What this deliberately does not decide yet

Legal equity instrument · termination / acquisition treatment · V0.2 persistence parameters · type-specific half-lives · subjective “effort” ratings.
