"use client";

import { useState, type ReactNode } from "react";
import { UseYourOwnershipPreview } from "./UseYourOwnershipPreview";

type Direction = "more" | "less";
type Scope = "global" | "group" | "place";
type OwnershipId = "progressive" | "founders-heavy" | "equal-start";
type FundingId = "customers" | "customers-then-investors" | "investors-early";
type LocationId = "us-de" | "us-other" | "outside-us";

type ArrowDef = { id: string; label: string; dir: "up" | "down"; compiled: string };

type Answers = {
  direction: Direction;
  object: string;
  scope: Scope;
  scopeDetail: string;
  missionConfirmed: boolean;
  arrows: string[];
  arrowOther: string;
  beneficiaries: string[];
  beneficiaryOther: string;
  harms: string[];
  productName: string;
  helpsDo: string;
  whoPays: string;
  whyPay: string;
  founders: { name: string; role: string }[];
  ownership: OwnershipId;
  location: LocationId;
  funding: FundingId;
};

const ARROWS: ArrowDef[] = [
  { id: "supply", label: "More people available", dir: "up", compiled: "Supply / availability" },
  { id: "quality", label: "Better quality", dir: "up", compiled: "Competency / quality" },
  { id: "speed", label: "Faster readiness", dir: "up", compiled: "Readiness speed" },
  { id: "access", label: "Better access", dir: "up", compiled: "Access" },
  { id: "durable", label: "Longer-lasting results", dir: "up", compiled: "Retention / durability" },
  { id: "cost", label: "Lower cost", dir: "down", compiled: "Cost" },
  { id: "burden", label: "Less burden on workers", dir: "down", compiled: "Worker burden" },
  { id: "risk", label: "Lower risk", dir: "down", compiled: "Safety risk" },
];

const BENEFICIARY_OPTS = [
  "Healthcare workers",
  "Patients",
  "Employers / organizations",
  "Communities",
];

const HARM_OPTS = [
  "Workers",
  "Customers",
  "Communities",
  "The environment",
  "Future generations",
  "I'm not sure yet",
];

const OWNERSHIP: { id: OwnershipId; label: string }[] = [
  {
    id: "progressive",
    label: "People who create lasting value should keep earning ownership",
  },
  {
    id: "founders-heavy",
    label: "Founders keep most ownership for a long time",
  },
  {
    id: "equal-start",
    label: "Start closer to equal among early people",
  },
];

const FUNDING: { id: FundingId; label: string }[] = [
  { id: "customers", label: "Customers first" },
  { id: "customers-then-investors", label: "Customers first, maybe investors later" },
  { id: "investors-early", label: "Raise soon" },
];

const LOCATIONS: { id: LocationId; label: string }[] = [
  { id: "us-de", label: "United States" },
  { id: "us-other", label: "United States (we'll still start with Delaware for now)" },
  { id: "outside-us", label: "Outside the United States (mock only)" },
];

/** Micro-steps: guided interview, not incorporation wizard. */
const STEPS = [
  { phase: "Your mission", title: "More or less?" },
  { phase: "Your mission", title: "Of what?" },
  { phase: "Your mission", title: "Who or where?" },
  { phase: "Your mission", title: "Your mission" },
  { phase: "Your mission", title: "What better looks like" },
  { phase: "Your mission", title: "Who benefits?" },
  { phase: "Your mission", title: "Who could be worse off?" },
  { phase: "Your company", title: "What are you starting?" },
  { phase: "Your company", title: "Who pays you?" },
  { phase: "Your company", title: "Why would they pay?" },
  { phase: "Your people", title: "Who is starting?" },
  { phase: "Your people", title: "Future builders" },
  { phase: "Your rules", title: "Defaults that protect people" },
  { phase: "Make it real", title: "Where and funding" },
  { phase: "Make it real", title: "Review" },
  { phase: "Make it real", title: "Your company" },
] as const;

const DEFAULTS: Answers = {
  direction: "more",
  object: "excellent healthcare workers",
  scope: "global",
  scopeDetail: "",
  missionConfirmed: true,
  arrows: ["supply", "quality", "speed", "access", "burden", "risk"],
  arrowOther: "",
  beneficiaries: ["Healthcare workers", "Patients", "Employers / organizations"],
  beneficiaryOther: "",
  harms: ["Workers", "I'm not sure yet"],
  productName: "Benchmark",
  helpsDo: "train healthcare workers more effectively",
  whoPays: "Healthcare organizations",
  whyPay:
    "They need to train clinicians faster and know they're ready",
  founders: [{ name: "Bryan", role: "Founder" }],
  ownership: "progressive",
  location: "us-de",
  funding: "customers-then-investors",
};

function compileMission(a: Answers): string {
  const verb = a.direction === "more" ? "Increase" : "Decrease";
  const noun = a.object.trim() || "___";
  if (a.direction === "more") {
    if (a.scope === "global") {
      return `${verb} the global supply of ${noun}.`;
    }
    if (a.scope === "group" && a.scopeDetail.trim()) {
      return `${verb} the supply of ${noun} for ${a.scopeDetail.trim()}.`;
    }
    if (a.scope === "place" && a.scopeDetail.trim()) {
      return `${verb} the supply of ${noun} in ${a.scopeDetail.trim()}.`;
    }
    return `${verb} the supply of ${noun}.`;
  }
  // less
  if (a.scope === "global") {
    return `${verb} ${noun} globally.`;
  }
  if (a.scopeDetail.trim()) {
    return `${verb} ${noun} for ${a.scopeDetail.trim()}.`;
  }
  return `${verb} ${noun}.`;
}

function companyLegalName(product: string): string {
  const base = product.trim() || "Untitled";
  if (/care/i.test(base)) return `${base}, PBC`;
  return `${base} Care, PBC`;
}

function Choice({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full border px-3 py-3 text-left transition-colors ${
        selected
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]"
      }`}
    >
      <span className="block font-[family-name:var(--font-sans)] text-sm font-medium leading-snug">
        {label}
      </span>
      {hint ? (
        <span
          className={`mt-1 block text-sm leading-snug ${
            selected ? "text-white/80" : "text-[var(--muted)]"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 border px-3 py-2.5 text-left ${
        checked
          ? "border-[var(--ink)]"
          : "border-[var(--line)] hover:border-[var(--ink)]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border font-[family-name:var(--font-sans)] text-xs ${
          checked
            ? "border-[var(--ink)] bg-[var(--ink)] text-white"
            : "border-[var(--line)]"
        }`}
        aria-hidden
      >
        {checked ? "✓" : ""}
      </span>
      <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--ink)]">
        {label}
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--ink)]";

function toggleIn(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function LaunchPrototype() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(DEFAULTS);
  const [compiling, setCompiling] = useState(false);
  const [done, setDone] = useState(false);

  const mission = compileMission(answers);
  const legalName = companyLegalName(answers.productName);
  const isReview = step === STEPS.length - 2;
  const isOutput = step === STEPS.length - 1;
  const meta = STEPS[step];

  function canContinue(): boolean {
    switch (step) {
      case 1:
        return answers.object.trim().length > 0;
      case 2:
        return (
          answers.scope === "global" || answers.scopeDetail.trim().length > 0
        );
      case 4:
        return answers.arrows.length > 0 || answers.arrowOther.trim().length > 0;
      case 5:
        return (
          answers.beneficiaries.length > 0 ||
          answers.beneficiaryOther.trim().length > 0
        );
      case 7:
        return (
          answers.productName.trim().length > 0 &&
          answers.helpsDo.trim().length > 0
        );
      case 8:
        return answers.whoPays.trim().length > 0;
      case 9:
        return answers.whyPay.trim().length > 0;
      case 10:
        return answers.founders.some((f) => f.name.trim());
      default:
        return true;
    }
  }

  function next() {
    if (isReview) {
      setCompiling(true);
      window.setTimeout(() => {
        setCompiling(false);
        setDone(true);
        setStep(STEPS.length - 1);
      }, 900);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    if (isOutput) {
      setDone(false);
      setStep(STEPS.length - 2);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  function reset() {
    setAnswers(DEFAULTS);
    setDone(false);
    setCompiling(false);
    setStep(0);
  }

  const compiledArrows = [
    ...ARROWS.filter((a) => answers.arrows.includes(a.id)),
    ...(answers.arrowOther.trim()
      ? [
          {
            id: "other",
            compiled: answers.arrowOther.trim(),
            dir: "up" as const,
          },
        ]
      : []),
  ];

  const ownershipLabel =
    OWNERSHIP.find((o) => o.id === answers.ownership)?.label ?? "";

  return (
    <div className="space-y-8">
      <div className="font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
        <span className="text-[var(--ink)]">{meta.phase}</span>
        <span className="mx-2">·</span>
        <span>
          {step + 1} of {STEPS.length}
        </span>
        <div className="mt-3 flex gap-1" aria-hidden>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 ${
                i <= step ? "bg-[var(--ink)]" : "bg-[var(--line)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 0 — more / less */}
      {step === 0 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            What do you want the world to have more or less of?
          </h2>
          <p className="text-[var(--muted)]">
            One choice. Mishys will write the mission sentence for you.
          </p>
          <div className="space-y-2">
            <Choice
              selected={answers.direction === "more"}
              onSelect={() =>
                setAnswers((a) => ({ ...a, direction: "more" }))
              }
              label="More of something"
            />
            <Choice
              selected={answers.direction === "less"}
              onSelect={() =>
                setAnswers((a) => ({ ...a, direction: "less" }))
              }
              label="Less of something"
            />
          </div>
        </section>
      ) : null}

      {/* 1 — object */}
      {step === 1 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            {answers.direction === "more" ? "More of what?" : "Less of what?"}
          </h2>
          <Field label="In plain words">
            <input
              className={inputClass}
              value={answers.object}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, object: e.target.value }))
              }
              placeholder="excellent healthcare workers"
            />
          </Field>
          <p className="text-sm text-[var(--muted)]">
            Examples: excellent healthcare workers · clinician autonomy ·
            logistics friction · time patients wait
          </p>
        </section>
      ) : null}

      {/* 2 — scope */}
      {step === 2 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Who or where?</h2>
          <div className="space-y-2">
            <Choice
              selected={answers.scope === "global"}
              onSelect={() =>
                setAnswers((a) => ({
                  ...a,
                  scope: "global",
                  scopeDetail: "",
                }))
              }
              label="Everyone / global"
            />
            <Choice
              selected={answers.scope === "group"}
              onSelect={() =>
                setAnswers((a) => ({ ...a, scope: "group" }))
              }
              label="A specific group"
            />
            <Choice
              selected={answers.scope === "place"}
              onSelect={() =>
                setAnswers((a) => ({ ...a, scope: "place" }))
              }
              label="A specific place"
            />
          </div>
          {answers.scope !== "global" ? (
            <Field
              label={
                answers.scope === "group" ? "Which group?" : "Which place?"
              }
            >
              <input
                className={inputClass}
                value={answers.scopeDetail}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, scopeDetail: e.target.value }))
                }
                placeholder={
                  answers.scope === "group"
                    ? "e.g. rural US nurses"
                    : "e.g. Sub-Saharan Africa"
                }
              />
            </Field>
          ) : null}
        </section>
      ) : null}

      {/* 3 — confirm mission */}
      {step === 3 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">We&apos;d write your mission as</h2>
          <p className="border border-[var(--ink)] px-4 py-4 text-lg font-semibold leading-snug text-[var(--ink)]">
            {mission}
          </p>
          <p className="text-sm text-[var(--muted)]">
            You chose the intention. Mishys chose the{" "}
            <code className="mono text-[var(--ink)]">Increase</code> /{" "}
            <code className="mono text-[var(--ink)]">Decrease</code> form —
            you never have to invent that convention.
          </p>
          <div className="space-y-2">
            <Choice
              selected={answers.missionConfirmed}
              onSelect={() =>
                setAnswers((a) => ({ ...a, missionConfirmed: true }))
              }
              label="Looks right"
            />
            <button
              type="button"
              className="font-[family-name:var(--font-sans)] text-sm text-[var(--link)] underline"
              onClick={() => setStep(0)}
            >
              Make it more specific — go back
            </button>
          </div>
        </section>
      ) : null}

      {/* 4 — arrows */}
      {step === 4 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            If this mission were succeeding, what would you expect to see?
          </h2>
          <p className="text-[var(--muted)]">
            Pick anything that matters. Mishys turns these into directional
            measures — you don&apos;t write a value equation.
          </p>
          <div className="space-y-2">
            {ARROWS.map((arrow) => (
              <CheckRow
                key={arrow.id}
                checked={answers.arrows.includes(arrow.id)}
                onToggle={() =>
                  setAnswers((a) => ({
                    ...a,
                    arrows: toggleIn(a.arrows, arrow.id),
                  }))
                }
                label={arrow.label}
              />
            ))}
          </div>
          <Field label="Anything missing?">
            <input
              className={inputClass}
              value={answers.arrowOther}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, arrowOther: e.target.value }))
              }
              placeholder="Optional"
            />
          </Field>
        </section>
      ) : null}

      {/* 5 — beneficiaries */}
      {step === 5 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            Who should be better off if you succeed?
          </h2>
          <div className="space-y-2">
            {BENEFICIARY_OPTS.map((b) => (
              <CheckRow
                key={b}
                checked={answers.beneficiaries.includes(b)}
                onToggle={() =>
                  setAnswers((a) => ({
                    ...a,
                    beneficiaries: toggleIn(a.beneficiaries, b),
                  }))
                }
                label={b}
              />
            ))}
          </div>
          <Field label="Someone else?">
            <input
              className={inputClass}
              value={answers.beneficiaryOther}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  beneficiaryOther: e.target.value,
                }))
              }
              placeholder="Optional"
            />
          </Field>
        </section>
      ) : null}

      {/* 6 — harms */}
      {step === 6 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            Who could accidentally be worse off?
          </h2>
          <p className="text-[var(--muted)]">
            Honest uncertainty is fine. Mishys keeps this in the Mission
            Contract so you don&apos;t optimize blindly.
          </p>
          <div className="space-y-2">
            {HARM_OPTS.map((h) => (
              <CheckRow
                key={h}
                checked={answers.harms.includes(h)}
                onToggle={() =>
                  setAnswers((a) => ({
                    ...a,
                    harms: toggleIn(a.harms, h),
                  }))
                }
                label={h}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 7 — company name + helps */}
      {step === 7 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">What are you starting?</h2>
          <Field label="Working name">
            <input
              className={inputClass}
              value={answers.productName}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, productName: e.target.value }))
              }
              placeholder="Benchmark"
            />
          </Field>
          <Field label={`${answers.productName.trim() || "It"} helps …`}>
            <input
              className={inputClass}
              value={answers.helpsDo}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, helpsDo: e.target.value }))
              }
              placeholder="train healthcare workers more effectively"
            />
          </Field>
        </section>
      ) : null}

      {/* 8 — who pays */}
      {step === 8 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Who pays you?</h2>
          <Field label="Customer">
            <input
              className={inputClass}
              value={answers.whoPays}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, whoPays: e.target.value }))
              }
              placeholder="Healthcare organizations"
            />
          </Field>
          <p className="text-sm text-[var(--muted)]">
            Revenue funds the mission. Revenue is not the mission.
          </p>
        </section>
      ) : null}

      {/* 9 — why pay */}
      {step === 9 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Why would they pay?</h2>
          <Field label="Their problem, in one sentence">
            <textarea
              className={`${inputClass} min-h-[5rem] resize-y`}
              value={answers.whyPay}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, whyPay: e.target.value }))
              }
              placeholder="They need to train clinicians faster and know they're ready"
            />
          </Field>
        </section>
      ) : null}

      {/* 10 — founders */}
      {step === 10 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Who is starting it?</h2>
          <p className="text-[var(--muted)]">Names only. Stock classes come later.</p>
          {answers.founders.map((f, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={f.name}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      founders: a.founders.map((row, idx) =>
                        idx === i ? { ...row, name: e.target.value } : row,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label="Role">
                <input
                  className={inputClass}
                  value={f.role}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      founders: a.founders.map((row, idx) =>
                        idx === i ? { ...row, role: e.target.value } : row,
                      ),
                    }))
                  }
                />
              </Field>
            </div>
          ))}
          <button
            type="button"
            className="font-[family-name:var(--font-sans)] text-sm text-[var(--link)] underline"
            onClick={() =>
              setAnswers((a) => ({
                ...a,
                founders: [...a.founders, { name: "", role: "Founder" }],
              }))
            }
          >
            Add another person
          </button>
        </section>
      ) : null}

      {/* 11 — ownership intention */}
      {step === 11 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            How should future builders participate?
          </h2>
          <p className="text-[var(--muted)]">
            Intention only. Mishys installs the contributor system and Mission
            Unit ledger.
          </p>
          <div className="space-y-2">
            {OWNERSHIP.map((o) => (
              <Choice
                key={o.id}
                selected={answers.ownership === o.id}
                onSelect={() =>
                  setAnswers((a) => ({ ...a, ownership: o.id }))
                }
                label={o.label}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 12 — rules defaults */}
      {step === 12 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">
            Mishys will install these protections
          </h2>
          <p className="text-[var(--muted)]">
            You don&apos;t configure them. They come from Missionism&apos;s
            human constraints and survive-founder rules.
          </p>
          <ul className="space-y-2 font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">
            {[
              "People are not optimization variables",
              "Contribution rules are prospective — not rewritten after the fact",
              "The mission can outlive the founders",
              "Future contributors keep a path to ownership",
              "Fork and exit remain possible",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 13 — where + funding */}
      {step === 13 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Where, and how do you fund it?</h2>
          <p className="text-[var(--muted)]">
            You choose operating reality and funding intention. Mishys chooses
            the legal adapter and paperwork style.
          </p>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
            Where
          </p>
          <div className="space-y-2">
            {LOCATIONS.map((loc) => (
              <Choice
                key={loc.id}
                selected={answers.location === loc.id}
                onSelect={() =>
                  setAnswers((a) => ({ ...a, location: loc.id }))
                }
                label={loc.label}
              />
            ))}
          </div>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
            Funding
          </p>
          <div className="space-y-2">
            {FUNDING.map((f) => (
              <Choice
                key={f.id}
                selected={answers.funding === f.id}
                onSelect={() => setAnswers((a) => ({ ...a, funding: f.id }))}
                label={f.label}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 14 — review */}
      {step === 14 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Review what Mishys understood</h2>
          <p className="text-[var(--muted)]">
            Ordinary answers in. Organizational package out. Still mocked — no
            filing yet.
          </p>
          <pre className="mono overflow-x-auto border border-[var(--line)] bg-white p-4 text-sm leading-relaxed text-[var(--body)]">
            {`YOU'RE STARTING
${answers.productName.trim() || "Untitled"}

MISSION
${mission}

WHAT BETTER MEANS
${compiledArrows
  .map((a) => `${a.compiled.padEnd(28)} ${a.dir === "up" ? "↑" : "↓"}`)
  .join("\n") || "(none)"}

YOUR COMPANY
Customer: ${answers.whoPays.trim()}
Problem: ${answers.whyPay.trim()}
Business: ${answers.helpsDo.trim()}
Mission bridge: Better ${answers.helpsDo.trim()}
  → mission progress ↑

PEOPLE
${answers.founders
  .filter((f) => f.name.trim())
  .map((f) => `${f.name} — ${f.role || "Founder"}`)
  .join("\n")}
Future contributors: ${ownershipLabel}

WHO BENEFITS
${[...answers.beneficiaries, answers.beneficiaryOther]
  .filter(Boolean)
  .join(", ") || "(none)"}

WHO COULD BE WORSE OFF
${answers.harms.join(", ") || "(none)"}`}
          </pre>
        </section>
      ) : null}

      {/* 15 — output */}
      {step === 15 ? (
        <section className="space-y-6">
          {compiling && !done ? (
            <p className="text-[var(--muted)]">Compiling Missionism company…</p>
          ) : (
            <>
              <div>
                <p className="font-[family-name:var(--font-sans)] text-sm uppercase tracking-wide text-[var(--muted)]">
                  You&apos;re starting
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {answers.productName.trim() || "Untitled"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Legal name preview: {legalName}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                  Mission
                </h3>
                <p className="text-lg font-semibold leading-snug">{mission}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                  What better means
                </h3>
                <pre className="mono text-sm leading-relaxed text-[var(--body)]">
                  {compiledArrows
                    .map(
                      (a) =>
                        `${a.compiled.padEnd(28)} ${a.dir === "up" ? "↑" : "↓"}`,
                    )
                    .join("\n")}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                  Your company
                </h3>
                <pre className="mono text-sm leading-relaxed text-[var(--body)]">
                  {`Customer: ${answers.whoPays.trim()}
Problem: ${answers.whyPay.trim()}
Business: ${answers.helpsDo.trim()}
Mission bridge:
  Better ${answers.helpsDo.trim()}
  → more mission progress
  → Mission ↑`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                  People & rules
                </h3>
                <ul className="space-y-1 font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">
                  {answers.founders
                    .filter((f) => f.name.trim())
                    .map((f) => (
                      <li key={f.name}>
                        {f.name} — {f.role || "Founder"}
                      </li>
                    ))}
                  <li>Future contributors: {ownershipLabel}</li>
                  <li>✓ Missionism human constraints</li>
                  <li>✓ Prospective contribution rules</li>
                  <li>✓ Mission survives founder</li>
                  <li>✓ Ownership pathway for future contributors</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                  Mishys will prepare
                </h3>
                <ul className="space-y-1 font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">
                  {[
                    "Mission Contract",
                    "Public-benefit language",
                    "Mission page ingredients",
                    "Contributor ownership system",
                    "Initial company structure (US-DE-PBC-CORP v0.1)",
                    "Mission Unit ledger",
                    "Equity settlement adapter",
                    "Governance defaults",
                    "Cap table / banking / payroll setup",
                    "Compliance schedule",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-[var(--ink)] px-4 py-4">
                <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--ink)]">
                  One thing needs your attention:
                </p>
                <p className="mt-1 text-lg text-[var(--body)]">
                  Sign formation documents.
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Mocked compilation — no filing, no Firebase, no securities
                  logic. The next real action is a signature.
                </p>
              </div>

              <UseYourOwnershipPreview />
            </>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-6 font-[family-name:var(--font-sans)] text-sm">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="text-[var(--muted)] underline"
            disabled={compiling}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <div className="ml-auto flex flex-wrap gap-3">
          {isOutput && done ? (
            <button
              type="button"
              onClick={reset}
              className="border border-[var(--line)] px-4 py-2 text-[var(--ink)] hover:border-[var(--ink)]"
            >
              Start over
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={compiling || !canContinue()}
              className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-white disabled:opacity-40"
            >
              {compiling
                ? "Compiling…"
                : isReview
                  ? "Create company"
                  : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
