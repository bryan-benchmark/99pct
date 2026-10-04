# Mission Decision Compiler

**Status:** Design doctrine — ready to prototype as a product surface.  
**Not** part of MCU arithmetic. Does not decide for humans.

> **Every meaningful decision goes through the same decision compiler.**

Not because AI should make the decision. Because humans are terrible at holding every second-order effect at once.

The system forces the decision-maker to answer:

> Who wins? Who pays? What moves in the Mission Equation? What hidden cost are we consuming? What happens if everyone behaves rationally under this rule? What happens ten years from now if we repeat it?

**Do not collapse this into one magic score.** That recreates the problem. Some things are **gates**, some are **arrows**, some are **tradeoffs**.

Companions: [HUMAN_COMPACT.md](./HUMAN_COMPACT.md) · [HUMAN_SUSTAINABILITY.md](./HUMAN_SUSTAINABILITY.md) · [MISSION_CONTRACT.md](./MISSION_CONTRACT.md) · [CONSTITUTIONAL_LAYERS.md](./CONSTITUTIONAL_LAYERS.md) · [COLLABORATION.md](./COLLABORATION.md)

---

## Standing role of AI

Missionism AI is primarily a **mechanism-design copilot**, not a judge.

Its job:

> There’s still a loser here. Can we design a better trade?

Until either a positive-sum equilibrium appears — or the unavoidable tradeoff is **completely visible** before a human chooses it.

---

## Universal Decision Test (mandatory lenses)

Every proposal compiles into the same object:

| Lens | Mandatory question |
|------|-------------------|
| **Human** | Does the contributor become better off for doing the behavior we want? |
| **Company** | Does this improve durability, economics, capability, or Mission Velocity? |
| **Customer / beneficiary** | Does the beneficiary receive greater net value? |
| **Mission** | Which mission arrows move, and in which direction? |
| **Human exposure** | What physical, temporal, emotional, legal, autonomy, or cognitive burden are humans asked to absorb? |
| **Externalities** | Who outside the transaction gets harmed or helped? |
| **Capital** | What cash, dilution, debt, optionality, or future obligations does this consume? |
| **Future contributors** | Does this make the opportunity better or worse for people who arrive later? |
| **Freedom / exit** | Does this increase switching costs, captivity, dependence, or inability to leave? |
| **Resilience** | Does this create a single point of failure, concentration risk, or brittleness? |
| **Reversibility** | If we’re wrong, how easily can we undo it? |
| **Evidence** | What do we know, what are we guessing, and what experiment would reduce uncertainty? |
| **Gaming** | If everybody selfishly optimizes this rule, what happens? |
| **Mission drift** | If we repeat this for 10 years, are we still pursuing the same mission? |
| **Opportunity cost** | What better thing are we *not* doing by choosing this? |

---

## Layer 1 — Classify the decision

| Class | Examples | Burden of proof |
|-------|----------|-----------------|
| **Experiment** | Try something | Plausible hypothesis |
| **Operating decision** | Hire, vendor, product, pricing | Expected positive Triple-Win after constraints |
| **Era decision** | Targets, resource allocation, MCU pools | Evidence + current bottleneck |
| **Value Equation change** | How success is measured | Strong evidence the ruler is wrong |
| **Arrow change** | What “better” means | Strong evidence conception of better is incomplete |
| **Mission change** | Purpose itself | Extraordinary evidence + governance |

Higher classes require harder approval. Changing a vendor ≠ removing an arrow from the Mission Equation.

Evolutionary speed limit: **the closer to mission DNA, the slower it mutates.**

---

## Layer 2 — Hard gates (before any scoring)

Stop — no amount of profit or Mission Value compensates:

- Illegal?  
- Fraudulent?  
- Violates a closed Era?  
- Violates an immutable contributor right?  
- Creates unacceptable safety / human-rights harm?  
- Makes the company insolvent under its capital policy?  
- Requires hiding material information from affected participants?  

Prevents: “Workers might die, but the numerator is gigantic.”

---

## Layer 3 — Triple-Win cards

| Card | Signals (illustrative) |
|------|------------------------|
| **Human** | Cash · ownership opportunity · autonomy · safety · time · workload · skill growth · job durability · exposure |
| **Company** | Revenue · cost · cash flow · EV · resilience · Mission Velocity · talent leverage · capital needs |
| **Customer / beneficiary** | Price · quality · safety · access · autonomy · time saved · switching freedom · outcome |

Gold standard: **↑ Human · ↑ Company · ↑ Customer.**

If any is ↓, do **not** auto-reject. Ask:

> **Can we redesign the decision so the loser stops losing?**

---

## Layer 4 — Arrow Map

Compile expected direction on each mission arrow (↑ / ↓ / → / ?), e.g.:

```text
Reach ↑↑ · Cost/EWYA ↓↓ · Trainer burden ↓↓↓ · Readiness ↑
Evidence ? · Excellence ? · Learner autonomy ↑ · Safety →
```

Uncertain arrows → prefer **experiment** over six months of philosophy.

---

## Layer 5 — Human Exposure ledger

For affected jobs/processes, track changes in:

Physical hazard · schedule unpredictability · on-call · night work · repetitive load · emotional trauma · cognitive overload · professional/legal consequence · surveillance · loss of autonomy · travel/displacement · family/time disruption  

Incentive design:

| Side | Effect of unavoidable exposure |
|------|--------------------------------|
| **Worker** | Higher unavoidable exposure → higher contribution economics |
| **Company / mission** | Higher exposure → lower Mission Efficiency |

Desired equilibrium:

> Worker benefits from accurately exposing burden. Owners benefit from eliminating it.

(See also FOUNDER_CLOCK / Base vs Impact: don’t reward preserving danger classifications.)

---

## Layer 6 — Externality Ring

| Ring | Who |
|------|-----|
| **Direct** | Employee · Company · Customer |
| **Near** | Family · Coworkers · Suppliers · Community |
| **Broad** | Environment · Public resources · Competition · Future workers · Future customers |

Makes captivity visible: retention via lock-in vs retention via value feels different on the Arrow Map (customer autonomy ↓↓↓, switching freedom ↓↓↓, ecosystem ↓).

---

## Layer 7 — Selfish-Agent Simulation

> Assume every actor understands this rule and rationally maximizes their own outcome. What behavior emerges?

If the equilibrium is harmful, **redesign** until the selfish equilibrium is positive-sum (or the tradeoff is explicit).

Classic: “Extra ownership for dangerous roles” → workers/managers preserve the danger label. Redesign: exposure rewards workers *and* eliminating exposure earns larger Impact + Mission Velocity → report honestly, eliminate hazard, fund elimination.

---

## Layer 8 — 10× / 10-year test

| Once | Repeated |
|------|----------|
| What if we do this once? | What if 10,000 times? |
| | What if this is culture for 10 years? |

Tiny bad incentives (e.g. manager equity by headcount) look harmless once and produce empire-building over decades. Show that.

---

## Layer 9 — Reversibility × confidence

| | Reversible | Irreversible |
|--|------------|--------------|
| **Low confidence** | Experiment quickly | Slow down |
| **High confidence** | Act | Act carefully but decisively |

Button color ≠ sell core IP ≠ change Mission Equation.

---

## Meta-decisions (stricter compiler)

Changing equations, arrows, or missions asks extra:

- Why is the old equation wrong? What evidence changed?  
- Which original arrow improves? Who gains / loses economically?  
- Conflict of interest for proposers?  
- How would Eras 1–N have scored under the new rule? Would historical decisions have changed?  
- What gaming becomes possible?  
- **Does the proposed ruler make reality better — or merely make the score easier to improve?**  

If the latter: reject.

---

## Output: Mission Decision Record (one page)

Every meaningful decision produces a durable record, e.g.:

```text
PROPOSAL
Replace overnight human support with AI + one rotating escalation engineer.

TRIPLE WIN
Human ↑↑   (removes 14 overnight shifts/week)
Company ↑↑ (opex −38%; reliability +12%)
Customer ↑ (24/7 maintained; escalation latency slightly ↑)

MISSION ARROWS
Access ↑ · Cost ↓ · Human burden ↓↓↓ · Quality → · Safety ?

HUMAN EXPOSURE  −71%
EXTERNALITIES   Potential job displacement
CAPITAL         $400K implementation
REVERSIBILITY   High
EVIDENCE        62%
GAMING          No obvious harmful equilibrium
BIGGEST UNKNOWN AI escalation safety

RECOMMENDED ACTION
Run 90-day controlled experiment.

SUCCESS THRESHOLD
Same-or-better safety & customer outcomes with ≥50% reduction in overnight Human Burden.
```

Store these. They become institutional memory.

---

## Institutional memory

Over years Missionism can learn, e.g.:

- Decisions that reduced Human Burden → retention +18%  
- High-confidence forecasts accurate 71% of the time  
- Systematic underestimation of switching friction  
- Experiments on Evidence more valuable than expected  

Corpus:

> When humans made decision X under conditions Y, what happened to Humans, Company, Customer, Mission, and externalities?

AI’s job: surface consequences humans historically failed to consider — not declare moral truth.

---

## Pseudo-automation (reduced)

Every meaningful decision asks:

1. Does the **human** win?  
2. Does the **company** win?  
3. Does the **beneficiary** win?  

Then:

4. What hidden **human burden** are we consuming?  
5. What **externalities** are we exporting?  
6. What **mission arrows** move?  
7. What if everybody **selfishly** optimizes this rule?  
8. What if we **repeat it for ten years**?  
9. How **reversible**? How **confident**?  

Finally:

> **Can we redesign it so more arrows point the right way at the same time?**

---

## Product placement

| Surface | Use |
|---------|-----|
| Mission Cell / Mine proposals | Default compile before work starts |
| Era / equation / arrow changes | Stricter meta-compiler + 2-of-3 where constitutional |
| Hiring (mission-accretive) | Operating decision + Builder Leverage |
| GoPrivate / Benchmark ops | Same object; different arrows |

Prototype may start as structured forms + templates; AI fill-in of Arrow Map, gaming sim, and 10-year extrapolation comes later. **Authority stays with humans under constitutional layers.**
