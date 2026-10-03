/**
 * Why now / The Coordination Problem — explanatory essay.
 * Not Canonical. Not a homepage substitute.
 * Maturity: Proposed framing for why Missionism exists as experimental tech.
 */

import { shortDefinition } from "./voice";

export const whyNowMeta = {
  title: "Why now",
  lede: `${shortDefinition} This essay explains why better organizational alignment matters as capability rises — especially with AI.`,
  source: "docs/proposals/WHY_NOW.md",
  sourceKind: "proposal" as const,
};

export const whyNowSections = [
  {
    title: "The compressed insight",
    paragraphs: [
      "Capitalism is extraordinarily good at turning resources into competition, innovation, and more resources. You do not need anyone centrally deciding what to build. Prices, ownership, competition, investment, and bankruptcy form a decentralized feedback system.",
      "Its cleanest measurable signal is roughly financial value. That signal is powerful because it is legible: a million dollars is more than nine hundred thousand.",
      "The problem arises when the easiest way to raise that score is not the thing we actually wanted the institution to exist for.",
    ],
    examples: [
      ["Healthcare", "maximize enterprise value", "make people healthy"],
      ["Education", "maximize institutional revenue", "maximize learning"],
      ["Social networks", "maximize engagement", "maximize healthy relationships"],
    ],
    close:
      "Missionism is not anti-capitalism. It keeps competition, entrepreneurship, ownership, incentives, investment, and experimentation. It asks whether we can change what the optimizer structurally rewards so that individual self-interest, organizational self-interest, and mission accomplishment point more nearly the same way.",
  },
  {
    title: "Capability is getting cheaper",
    paragraphs: [
      "Human beings repeatedly create controlled environments inside a messy world: fire, agriculture, cities, power grids, corporations, software, networks, AI.",
      "Each layer makes something underneath dramatically easier. Your outlet hides a power station. Your phone hides a telecommunications network. A button on a shopping site hides an enormous logistics system. AI is beginning to hide large amounts of cognitive labor.",
      "Every abstraction creates new dependency and new possibility above itself. So we continually build a taller structure of capability.",
    ],
    note:
      "You can think of the growing burden of uncertainty, coordination, failure modes, and conflicting incentives as a kind of organizational entropy—not thermodynamic entropy literally, but the coordination load that accompanies greater capability. That distinction matters. The physics analogy is a metaphor for thinking, not a claim about molecules.",
  },
  {
    title: "AI makes misalignment more expensive",
    paragraphs: [
      "A mediocre optimizer pointed slightly in the wrong direction does limited damage. A spectacular optimizer pointed slightly in the wrong direction can transform an ecosystem.",
      "Give an organization more capable agents and it can search every pricing opportunity, customize every sales message, optimize every contract, test thousands of strategies, and personalize every advertisement. Whatever the organization measures becomes enormously more optimizable.",
      "That is wonderful when the metric is close to what humans actually want. It is dangerous when the metric is not.",
      "So one possible future is capitalism plus AI as hyper-efficient financial optimization. Missionism tries to insert mission alignment between those two.",
    ],
    punch:
      "AI makes intelligence less scarce. Missionism is an experiment in making alignment less scarce.",
  },
  {
    title: "The tower of control",
    paragraphs: [
      "Think about what happens inside a badly aligned organization. The company says its purpose is X. Compensation rewards Y. Investors reward Z. Managers optimize quarterly metric Q. Employees discover behaviors that improve Q without improving X. Leadership adds controls. Employees game the controls. Management adds another reporting layer.",
      "Now you need more KPIs, audits, compliance, performance reviews, incentives, approvals, committees, and reorganizations.",
      "The system’s internal coordination load keeps rising because the incentives are not naturally producing the behavior the organization wants. So you keep adding control machinery.",
    ],
    claim:
      "Better alignment should reduce the amount of coercion, monitoring, and managerial complexity required to keep an organization pointed at its purpose.",
  },
  {
    title: "What Missionism actually has to invent",
    paragraphs: [
      "It does not succeed merely because an organization says it is maximizing human value. Human value is vastly harder to measure than shareholder value. Whose flourishing? Employees? Customers? Future customers? Community? What about tradeoffs?",
      "The thing that makes shareholder capitalism powerful is not that shareholders are morally correct. It is that the system has a remarkably simple feedback signal.",
      "Missionism risks replacing one crude objective with thirty ambiguous ones. Then the entropy-reducing layer becomes an entropy-producing bureaucracy.",
    ],
    breakthrough:
      "A sufficiently simple mechanism whereby contributing to the mission causes ownership, control, and economic benefit to flow toward the people actually advancing it—without requiring a central authority to subjectively adjudicate everyone’s moral worth.",
    close:
      "That is much harder than caring about the mission. And much more valuable. Markets compress enormous complexity into a price. Missionism needs something analogous: a way for enormous organizational complexity to become “Did this person substantially advance this particular mission?” and then translate that into ownership, influence, upside, and succession.",
  },
  {
    title: "Systematic heroism is a fragile dependency",
    paragraphs: [
      "When mission and financial incentive diverge, organizations often rely on people at every layer to voluntarily choose the harder-to-measure thing over the simpler measurable thing—again and again, across generations.",
      "That is systematic heroism. Remarkably good companies sometimes pull it off. For a while. But they are fighting an incredibly simple competing heuristic: make the number go up.",
      "When nobody knows what to do, financial value becomes the default answer because it is easy to measure. The human consequence usually is not.",
      "A durable mission should survive ordinary people. Don’t make culture fight the structure. Make the structure reinforce the culture.",
      "AI will make the optimizer vastly more powerful. If an organization has to rely on thousands of humans continually overriding its default incentives through judgment and conscience, adding AI doesn’t solve that problem. It potentially accelerates the underlying objective.",
    ],
    punch: "Stop demanding better people. Build better games.",
  },
  {
    title: "The Missionism experiment",
    paragraphs: [
      "Here is the hypothesis. Here is the mechanism family. Here are predicted effects. Here is how to run an experiment. Here is what would cause us to conclude we are wrong.",
      "It should feel less like “we discovered the next economic system” and more like: there is a structural problem coming into sharper relief. Here is a mechanism we think may help. Please try to break it.",
      "Humanity has been compensating for misaligned organizational incentives with systematic heroism. As our organizations become more powerful, that becomes an increasingly dangerous dependency. We should encode more of the alignment into the system itself.",
    ],
    boxed:
      "Better alignment → less required control → more human autonomy at greater organizational complexity.",
    constraint:
      "Every rule Missionism adds should remove more coordination complexity than it creates.",
  },
] as const;
