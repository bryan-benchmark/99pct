# MISSION_UNITS_V0.1 — Ownership Kernel Design Lock

**Status:** Proposed  
**Maturity:** Proposed (product) · Experimental (mechanism)  
**Not Canonical.** Does not feed CANONICAL UI.  
**Protocol version:** Missionism Protocol v0.1 adjacent  
**Last updated:** September 2026  
**Related:** [`mishys-ownership-kernel.md`](./mishys-ownership-kernel.md) · claim `contributorPath` in [`spec/canonical.json`](../../spec/canonical.json) · MCU naming still **Open**

---

## Locked question

Can Missionism maintain a continuously changing, auditable ownership ledger where:

- people earn ownership by contributing value,
- paid employees still earn ownership,
- underpaid / at-risk contributions can earn additional credit,
- past contributors keep what they earned,
- future contributors naturally dilute everyone,
- nobody manually edits ownership percentages,
- every ownership change can be explained from immutable contribution events?

If yes, this becomes the economic kernel of Mishys.

---

## 1. Core primitive

The kernel does **not** directly allocate percentages. It allocates **Mission Units (MU)**.

```text
Contributor → Contribution Event → Mission Units
→ Contributor MU / Total MU → Economic Ownership %
```

```text
ownership(contributor)
=
finalized Mission Units owned by contributor
/
all finalized Mission Units in mission
```

Ownership percentage is an **output**, never manually entered.

---

## 2. Mission Units

Properties: created through events · append-only after finalization · attributable · timestamped · explainable · auditable · never silently rewritten · corrected only via explicit adjustment events.

Nobody loses units when others earn. The denominator grows. That is intentional dilution.

---

## 3. Contribution Event

Minimum schema:

```ts
ContributionEvent {
  id
  missionId
  contributorId
  occurredAt
  period
  type
  referenceValue
  multiplier
  units
  evidence[]
  explanation
  status
  createdAt
  finalizedAt
  policyVersion
}
```

Invariant: `units = referenceValue × multiplier`  
For v0.1: no arbitrary AI-generated ownership values.

---

## 4. Initial contribution types (v0.1)

| Type | Reference | Notes |
|------|-----------|--------|
| `LABOR` | Fair market value of contribution in period | Salary does **not** zero labor MUs |
| `AT_RISK_LABOR` | Unpaid gap × mission risk multiplier | In addition to normal labor |
| `CASH` | Dollars genuinely placed at risk | Not normal purchases |
| `EXPENSE` | Approved unreimbursed expenses | Similar to cash at risk |
| `ADJUSTMENT` | Explicit correction | Never silent rewrite of finalized events |

**Cash compensation** and **Mission Units** are separate systems.

---

## 5. Explicitly excluded from v0.1

Subjective effort · hours alone · popularity · peer votes · unconstrained AI judgment · commit counts · meetings · vague impact · founder discretion · revenue attribution · NPS · succession · parent/child mission MUs · etc.

Prove the kernel with deterministic inputs first.

---

## 6. Reference value

Set **before** the period evaluated. Changes are **prospective**. No retroactive “amazing month → $90k reference.”

> Ownership rules should normally be established before their outcomes are known.

---

## 7. Epochs

Monthly for v0.1: collect → review → dispute → finalize → recalculate.

Event states: `DRAFT` | `PENDING` | `FINALIZED` | `VOIDED`

Finalized events are immutable; corrections use `ADJUSTMENT`.

---

## 8–12. Automation, cash, departure, joining, founders

- Auto-generate normal labor from reference compensation (prorate mid-month starts).
- Underpay → normal labor + at-risk units.
- Departure default: retain finalized units; stop new units; natural dilution.
- Joiners negotiate reference values, not static %.
- Founders: **no magical 100%**. Explicit genesis contribution events only.

---

## 13. Economic vs legal

```text
Mission Unit ledger → Economic ownership → Legal adapter → stock / units / contract / …
```

Legal true-up is periodic/settlement — not every month.

---

## 14. Mission rules

Versioned `MissionEconomicPolicy` (epoch, multipliers, departure policy, `effectiveAt`). Events record policy version. Changes prospective.

---

## 15–17. Evidence, AI boundary, auditability

Evidence explains; it does not invent units.  
AI may detect/suggest/explain/flag — not autonomously mint ownership without a deterministic adopted rule.  
Any % must expand to a simple event list + division.

---

## 18–19. Product surface (later)

Screens: Mission · People · Rules · Activity · Ownership.  
Killer UX: add person with reference + cash + start date → monthly MU → % + Why?

---

## 20. First build: simulator (before Mishys app)

Site path: `/simulators/mission-units` (Proposed / Experimental tooling — not Canonical).

### Torture chamber (required before tuning)

- Executable invariants in `src/mission-units/invariants.test.ts` (build fails on regression).
- Genesis = import of historical labor / cash / expenses — **no arbitrary genesisUnits**.
- Corrections = `REVERSAL` + replacement tied to prior event — **no unrestricted ADJUSTMENT mint**.
- Long-horizon scenarios including 100-year steady-state ± inheritance labeling.
- Explicit inflation: nominal vs real-dollar reference modes.
- Market compensation documented as **experimental proxy**, not mission value.
- Sensitivity sweeps + ownership half-life / projected % if contributor stops earning.

**Do not tune the Benchmark 24mo result until the same rules survive 2 / 20 / 100 years.**

---

## 21. Deferred

Outcome-based MU · commissions · succession · recursive missions · governance · inheritance · liquidity · legal/tax · clawbacks · etc.

---

## 22. Success criterion

Humans in a 12–24 month model can say: I understand why I own what I own; I could roughly predict earnings before work; we didn’t renegotiate % constantly; no manual equity spreadsheet; history is explainable; fair enough to keep using.

If that fails: fix the primitive — do not add sophistication.
