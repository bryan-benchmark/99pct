/**
 * Homepage — Declaration, not Constitution.
 * Explanatory / aspirational. Not normative.
 * Voice: src/content/voice.ts · Principles: docs/proposals/MISSIONISM_COMMUNICATION.md
 */

import {
  brandLines,
  shortDefinition,
  tagline,
} from "./voice";

export const homeHero = {
  ...tagline,
  definition: shortDefinition,
  primaryCta: { href: "/how-it-works", label: "See how it works" },
  secondaryCta: { href: "https://mishys.com", label: "Build with Missionism", external: true },
};

export const whyThisMatters = {
  title: "Why this matters",
  lead: "You can spend decades building a company and leave owning none of it.",
  body: [
    "Most organizations separate the people who own the institution, the people who run it, the people who do the work, and the thing the institution claims to exist for.",
    "Missionism tries to align them.",
  ],
};

export const threeIdeas = {
  title: brandLines.ownSteerServe,
  triadTechnical: brandLines.triadTechnical,
  items: [
    {
      label: "Own it",
      code: "OWNERSHIP",
      body: "The people who create lasting value progressively earn ownership — not a poster telling them to act like owners.",
    },
    {
      label: "Steer it",
      code: "AGENCY",
      body: "Authority should live close to the people with the knowledge and responsibility to decide.",
    },
    {
      label: "Serve the mission",
      code: "ALIGNMENT",
      body: "The organization exists to accomplish something real. Ownership, authority, and incentives should reinforce that mission.",
    },
  ],
};

export const whatChanges = {
  title: "What changes",
  pairs: [
    {
      today: "Your title mostly determines your power.",
      missionism: "Authority follows responsibility and demonstrated capability.",
    },
    {
      today: "Equity is mostly allocated at the beginning.",
      missionism: "Ownership keeps being earned as new people create value.",
    },
    {
      today: "The mission statement hangs on the wall.",
      missionism: "The mission helps decide priorities, incentives, and success.",
    },
  ],
};

export const whatDoesntChange = {
  title: "What doesn’t change",
  still: "Companies still sell things, make money, compete, raise capital, have leaders, hire people, and make hard decisions.",
  changes:
    "Missionism changes who progressively owns the institution, how people help steer it, and what the organization is ultimately trying to accomplish.",
};

export const builtForGenerations = {
  title: "Built for generations",
  body: [
    "Founders start institutions. Generations of people build them.",
    "You can earn ownership during your career and keep what you earned after you leave — while people who come after you keep earning ownership too.",
  ],
  punch: "The past keeps something. The future still gets a chance.",
};

export const weComeInPeace = {
  title: brandLines.weComeInPeace,
  body: [
    "We are not trying to start a war between workers, founders, executives, and investors.",
    "We are trying to design institutions where their interests can compound together.",
  ],
  point: brandLines.noHeroes,
};

export const goDeeper = {
  title: "Go deeper",
  links: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/why-now", label: "Why now" },
    { href: "/specification", label: "Specification" },
  ],
};
