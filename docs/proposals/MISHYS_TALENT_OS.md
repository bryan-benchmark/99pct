# MISHYS TALENT OS — Architecture V0.1

**Status:** Proposed  
**Maturity:** Experimental  
**Not Canonical.** Do not present as Missionism Core.

**Related:**

- [`MISHYS_LAUNCH.md`](./MISHYS_LAUNCH.md) — formation → long-term operating system
- [`OUTCOME_MISSION_UNITS.md`](./OUTCOME_MISSION_UNITS.md) — outcomes as credit; company blockers documented
- [`mishys-ownership-kernel.md`](./mishys-ownership-kernel.md) — MU economic layer

**Code skeleton:** `src/talent/` (types + invariant TODOs only in Phase 0)

---

## Product thesis

Mishys should replace the normal corporate stack:

```text
job title
+ vague job description
+ annual performance review
+ manager opinion
+ opaque promotion
+ salary negotiation
+ HRIS
```

with:

```text
MISSION
  ↓
BILLET
  ↓
OUTCOME CONTRACT
  ↓
PERSON + VERIFIED CAPABILITY
  ↓
WORK / EVIDENCE
  ↓
OUTCOME + LEVERAGE
  ↓
MU / CASH / SERVICE RECORD
  ↓
GRADE READINESS
  ↓
NEXT BILLET
```

The fundamental unit is not a job title.

It is:

> **A person trusted to own a defined amount of mission responsibility for a defined period under prospectively known rules.**

This fills in the Launch “after formation” operating system (hire → contributor identity, role → scorecard, outcomes → MU, policy changes prospective, full audit trail). It is **not** a separate HR product.

---

## Separation of concerns (protect this)

The biggest failure mode of corporate talent systems is collapse into one fuzzy concept called “seniority.” Mishys refuses that collapse:

```text
GRADE          trusted scope
TRACK          kind of contribution
SPECIALTY      what you know / can do
BILLET         what you own right now
SERVICE        history and repeated evidence
COMPENSATION   cash / risk / outcome agreement
MISSION UNITS  lasting contribution record
AUTHORITY      explicit grants on a billet
```

**None may silently derive another.**

Examples that must remain valid:

```text
G5 engineer · 0 direct reports
G4 manager · 22 direct reports

8 years service ≠ automatic G5
200,000 MU ≠ automatic management authority
```

Military research that informs this layer:

- talent marketplaces can match people using explicit knowledge / skills / behaviors / preferences;
- “fully qualified” can be separated from actual promotion until a valid higher-scope role exists;
- higher-stakes selection benefits from multiple independent assessments (addresses Peter Principle: excellence in job N ≠ fitness for job N+1).

---

## Core Talent OS laws

```text
SCOPE_NOT_STATUS
Grade represents trusted scope, not human worth.

BILLET_NOT_TITLE
Responsibility lives in billets, not prestige labels.

AUTHORITY_IS_EXPLICIT
Power comes from inspectable grants, not implication.

OUTCOME_NOT_ACTIVITY
Own outcomes, not busywork.

TASKS_ARE_MUTABLE
Current tasks may be improved, automated, challenged, or eliminated.

BURDEN_CANNOT_HIDE
Moving work elsewhere is not elimination.

TIME_IS_EVIDENCE
Service creates evidence, not promotion entitlement.

NEXT_GRADE_PROOF
Promotion measures ability to perform the next scope.

QUALIFIED_NOT_PROMOTED
Readiness and assignment are separate states.

NO_FORCED_CURVE
Another contributor does not need to lose for you to advance.

MULTIPLE_PATHS_UP
Management is not the only promotion path.

PROSPECTIVE_RULES
Rules exist before outcomes are known.

FACTS_NOT_FEELINGS
Consequential judgments point to inspectable evidence.

AI_ADVISES_HUMANS_DECIDE
Algorithms may recommend; accountable authorities decide.

THREE_MISSES_TRIGGER_REVIEW
Repeated failure triggers diagnosis, not automatic punishment.

CORRECT_BY_REVERSAL
Finalized history is never silently rewritten.

WHY_IS_ALWAYS_AVAILABLE
Every consequential decision must be explainable.
```

Executable counterparts live in `src/talent/invariants.test.ts` (Phase 0: skipped TODOs).

---

## 1. Grade means trusted scope

Grade answers only:

> **How much uncertain responsibility has this person repeatedly demonstrated that we can safely trust them to own?**

Grade must **not** mean: human worth, seniority, compensation, number of reports, ownership, title prestige, or organizational popularity.

Experimental ladder (exactly seven grades for v0.1 — no subgrades):

```text
G1  Execute bounded work
G2  Own an outcome
G3  Own a system
G4  Own a mission slice
G5  Own a major mission outcome / function
G6  Own multiple mission systems
G7  Institutional steward
```

If seven grades eventually prove insufficient, empirical evidence must justify changing the model.

---

## 2. Two equal career tracks

```text
BUILDER / EXPERT     G1 → G7
STEWARD / LEADER     G1 → G7
```

Same grade means comparable scope / blast radius. Different required evidence.

```text
G5 Builder   owns architecture used by whole company
G5 Steward   owns four interdependent teams
```

Neither is intrinsically above the other. Track switching is allowed when next-grade capability is demonstrated.

---

## 3. Grade ceiling vs billet authority

Grade establishes a **maximum trusted scope**. A billet grants **actual responsibility**. `AuthorityGrant` supplies **specific powers + limits + duration**.

A G6 person without a billet that grants hiring authority cannot hire merely because they are G6. Rank must not become aristocracy.

---

## 4. Billet, not permanent task list

A billet answers: *What mission responsibility currently needs an owner?* — not *What title should we give someone?*

Every billet binds to an outcome contract template (floor / target / stretch / guardrails / raw fact sources), required and preferred capabilities, an authority template, and a human-value classification.

Org graph primary:

```text
MISSION → MISSION SLICE → BILLET → PERSON
```

Not CEO → VP → Director → Manager → Worker. Managerial relationships may exist; the primary graph answers who owns which part of the mission.

Titles are display labels only. Machine-readable truth:

```text
Track + Grade + Specialty + Billet
```

---

## 5. Outcome contract semantics

Use the existing outcome-MU philosophy. Do not compensate prospective hours as contribution.

```text
FLOOR MISS     potential delivery miss
TARGET MISS    lower performance / MU — NOT automatically a strike
STRETCH MISS   zero negative consequence
```

Company / system blockers must be documented (extends `OUTCOME_MISSION_UNITS.md`).

---

## 6. Work leverage ladder (no universal multiplier)

Every recurring task may exist in:

```text
COMPLETE → IMPROVE → AUTOMATE → ELIMINATE
```

Plus `CHALLENGE` (“I don’t think this work should exist”) which initiates investigation — it is not a higher state.

Core rule: **Own the outcome, not the task.**

**Do not hardcode** complete=1× / improve=1.5× / automate=2× / eliminate=3×. That creates gaming.

Separate:

```text
OUTCOME VALUE   Did the mission outcome happen?
LEVERAGE VALUE  Did this create reusable future capacity?
```

For v0.1: track leverage independently and **shadow-score** it. Do not mint irreversible MU from generalized leverage until empirical pilots establish a defensible formula. Bespoke scorecard leverage KPIs remain valid when they are prospectively specified.

Every improve / automate / eliminate requires a **Burden Test**. Burden shifting is not elimination. Human-value tags (`INCIDENTAL` | `USEFUL` | `IMPORTANT` | `ESSENTIAL`) constrain automation recommendations.

---

## 7. Service, qualification, promotion

Service earns **evidence**, not entitlement. Display years of service prominently; do not auto-promote from tenure.

Separate states:

```text
NOT_READY
→ ELIGIBLE_FOR_ASSESSMENT
→ QUALIFIED_FOR_Gn
→ WAITING_FOR_Gn_SCOPE
→ ASSIGNED_TO_Gn_BILLET
→ PROMOTED_TO_Gn
```

Promotion evaluates the **next** grade (current reliability + next-grade capability + next-grade proof + actual next-grade scope). Assessment burden scales with authority.

Promotion is standards-based — **no forced rankings**. Multiple people can qualify. Actual promotion still requires real scope.

Build readiness around a **Proof Graph**, not “manager clicks PROMOTE.”

---

## 8. Performance exceptions

```text
DeliveryMiss      controllable floor miss → potential strike
CalibrationMiss   aggressive forecast overestimate while meeting floor → not a strike
SystemBlocker     company/system prevented delivery → never a strike
```

Pilot default (Experimental): **3 validated delivery misses within rolling 6 finalized epochs** → mandatory **Grade Review**, not automatic demotion.

Grade Review outcomes: `NO_ACTION` | `ROLE_MISMATCH` | `SKILL_GAP` | `SCOPE_REDUCTION` | `EXIT`.

Serious misconduct is completely separate and must not use the strike system.

Strikes expire for **consequences** (rolling window); the audit ledger remains permanent.

Grade reduction is **scope correction**, not punishment.

---

## 9. Compensation belongs to billet / epoch

Grade may inform a market-reference range. It must not determine exact compensation.

Compensation elections (`SAFE` | `STANDARD` | `AGGRESSIVE`) change risk allocation, not mission truth. Same outcomes; different cash / upside mix. Elections lock before outcomes are known.

---

## 10. Talent profile + billet marketplace

Talent profile modeled on KSB-P (knowledge / skills / behaviors / preferences), richer: verified vs self-claimed capabilities must be distinct fields.

Marketplace matches person ↔ billet and always exposes a **reason vector** — never a bare match percentage.

AI may recommend, explain gaps, surface bias. AI must **not** autonomously fire, demote, deny promotion, finalize strikes, change compensation, mint MU, create authority, or make protected-rights decisions.

---

## 11. Evidence, receipts, policy, appeals

One common `Evidence` primitive. Everything consequential points to evidence IDs.

Every consequential decision creates an immutable `DecisionReceipt`. Corrections = REVERSAL + replacement. No delete, no overwrite, no silent history rewrite. Mirror the existing MU event model.

Policy versioning on every important object — changes are prospective only.

Appeals are first-class (`FACT_ERROR` | `POLICY_MISAPPLIED` | `EVIDENCE_MISSING` | `CONFLICT_OF_INTEREST` | `OTHER`). Appeals challenge facts or application of existing rules — they cannot rewrite the rule after seeing the outcome.

Reliability is machine-computed (`committed floors met / eligible finalized epochs`), displayed as evidence — not turned into a universal human-value score.

---

## 12. Anti-gaming audits

Background audits create `AuditFinding`s (not automatic punishment) for: compensation gaming, attribution gaming, automation gaming, grade gaming, strike gaming, matching bias, scope inflation, metric collapse.

---

## 13. Integration boundary

```text
talent facts / finalized outcome evidence
        ↓
outcome MU kernel
```

**Do not** put Talent OS inside `src/mission-units`. Sibling subsystem: `src/talent/`.

Talent must not directly mint arbitrary MU. Use the existing outcome kernel. A locked pilot scorecard and its economics are a **compatibility test**, not something to redesign.

---

## 14. Suggested code structure (later phases)

```text
src/talent/
  types.ts              ← Phase 0
  invariants.test.ts    ← Phase 0 (skipped TODOs)
  grades.ts
  billets.ts
  authority.ts
  capabilities.ts
  evidence.ts
  commitments.ts
  leverage.ts
  performance.ts
  service.ts
  promotion.ts
  matching.ts
  receipts.ts
  audit.ts
  scenarios.ts
```

Simulator (Phase 4): `/simulators/talent` — break the architecture before real employees depend on it.

---

## 15. Build sequence

| Phase | Deliverable |
|-------|-------------|
| **0** | This doc + `types.ts` + invariant TODOs + Launch cross-link. **Founder review gate.** |
| 1 | Immutable kernel: Grade, Track, Billet, AuthorityGrant, Evidence, ServiceRecord, DecisionReceipt, PolicyVersion |
| 2 | Work leverage + performance state machines (leverage shadow-only) |
| 3 | Promotion engine (no manager bypass) |
| 4 | Talent simulator + torture scenarios |
| 5 | Benchmark pilot mapping (named participants, future hires) — employment consequences manual |
| 6 | Job / person UX |
| 7 | Marketplace (AI recommends only) |
| 8 | Cross-org audit system |
| 9 | Certification integration (inspect agency / inspectable authority — not require exact G1–G7) |

---

## 16. UI principle

Surface should feel simpler than corporate HR:

```text
What do I own?
How am I doing?
What did I earn?
What can I improve or eliminate?
What can I own next?
What do I need to prove?
Why did the system make this decision?
```

One-next-action rule (same as Launch compliance UX). Sophisticated machinery underneath; common sense on the surface.

---

## 17. What NOT to decide yet

```text
exact time-in-grade minimums
exact strike window after Benchmark pilot
universal leverage → MU conversion
universal cash-to-MU mix by grade
whether seven grades remain correct
exact requirements for each specialty
public reputation scoring
cross-company portability of Grade
cross-company portability of strikes
whether organizations trust external Mishys Grade wholesale
AI matching weights
AI-generated behavioral scores
automatic employment termination
```

Do not prematurely constitutionalize them. Do **not** edit `spec/canonical.json` for this layer.

---

## 18. End-state vision

Join Mishys → it knows verified capability, proven scope, mission preferences, risk preference, growth goals → matches to billets with clear floors / upside / authority / next proof → records what happened → cash + MU + service record → eventually surfaces G5 problems that fit → choose one.

No giant HR bureaucracy required. Complexity lives in the compiler, not in the employee’s head.

---

## Torture-chamber scenarios (Phase 4+)

A Brilliant salesperson · B Quiet system builder · C Aggressive forecaster · D Company failure · E Three true misses · F Peter Principle · G External expert · H Fake automation · I Human-essential task · J Grade inflation

See build plan / `src/talent/scenarios.ts` when implemented. Phase 0 documents intent only.

---

## Phase 0 confirmation

- Canonical Missionism (`spec/canonical.json`) untouched
- Existing MU economics and the benchmark six-month scorecard untouched
- No persistence, Firebase, APIs, AI matching, or product UI
- Status remains Proposed / Experimental / Not Canonical
- Founder review (conceptual): **PASS** — seal via commit/push before Phase 1
- Founder boundaries encoded in `src/talent/types.ts` as `TALENT_OS_FOUNDER_BOUNDARIES`:
  1. Grade does not implicitly own authority / comp / MU / billet
  2. Qualification ≠ promotion (structural: `currentGrade` vs `targetGrade` + state)
  3. Performance exceptions never mutate grade; only GradeReview → finalized receipt
  4. `DecisionReceipt` is the shared append-only audit spine
  5. G1–G7 is Mishys Experimental — not Canonical Missionism
- Invariant suite stays `1 pass + 25 todo` until Phase 1 implements real laws
