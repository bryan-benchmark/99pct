/**
 * 99pct product-shell copy.
 * Missionism definitions stay in voice.ts. This file does not redefine them.
 */

export const productCopy = {
  name: "99pct",
  mark: "99%",
  description: "Open-source infrastructure for people to start Missions, find Work, and build what should exist together.",
  eyebrow: "FOR THE 99%, BY THE 99%",
  headline: "Build what should exist.",
  lede: "99pct is an open-source place to start a Mission, find people, break it into Projects and Work, and build it together.",
  futureRails: "The long-term goal is to make contribution visible and auditable, then let Missions recognize it with MCUs and connect it to real ownership only where the legal machinery actually exists.",
  use: { href: "/use", label: "Use 99pct" },
  build: { href: "/work", label: "Build 99pct" },
  start: { href: "/missions/new", label: "Start a Mission" },
  explore: { href: "/missions", label: "Explore Missions" },
  modesTitle: "Three ways to take part",
  modes: [
    { label: "Use", body: "Choose 99pct utilities for ordinary life." },
    { label: "Operate", body: "Provide the actual service inside a Utility Mission." },
    { label: "Build", body: "Build and maintain Missions and infrastructure through Projects and Work." },
  ],
  modesTruth: "No consumer Utility Mission is live yet. Operator surfaces arrive with the first real utility.",
  growthTitle: "How 99pct grows",
  liveNowTitle: "Live now",
  liveNow: [
    "Start a Mission",
    "Create Projects",
    "Post needed Work",
    "Express interest",
    "Mutually confirm helping",
  ],
  nextTitle: "Being built next",
  next: [
    "Record Contribution",
    "Review and recognize Contribution",
    "Issue MCUs under transparent Mission rules",
    "Connect recognized contribution to legal ownership only where implemented",
  ],
  directionTitle: "Built to be used",
  direction: [
    "People should be able to build together without asking a conglomerate for permission.",
    "Useful infrastructure should be open and forkable.",
    "People doing the building should have a path for contribution to matter.",
    "Systems should reduce friction rather than blame humans for process failures.",
    "99pct is designed around win-win-win outcomes among humans, Missions, and the communities they serve.",
  ],
  protocolTitle: "Powered by Missionism",
  protocol: "Missionism is the open protocol underneath 99pct: a way to organize work around a shared mission, human agency, contribution, and progressive ownership. You do not need to understand the protocol before using 99pct.",
  protocolLink: { href: "/missionism", label: "Read the Missionism protocol" },
  source: { href: "https://github.com/bryan-benchmark/99pct", label: "Source (AGPL-3.0)" },
  footerMark: "99pct · For the 99%, by the 99%.",
  footerTruth: "99pct is open-source infrastructure for building Missions together.",
} as const;

export const useCopy = {
  title: "Use 99pct",
  lede: "A place to find everyday services built for the 99%, by the 99%.",
  examplesTitle: "Future utilities",
  examples: ["Rideshare 99", "Stay 99", "Music 99"],
  empty: "No 99pct utilities are live yet. We are building the shared infrastructure first.",
  substrate: "Future customer services can use different interfaces while sharing the same 99pct substrate.",
  build: { href: "/work", label: "Build the infrastructure" },
} as const;

export const findWorkCopy = {
  title: "Find Work",
  lede: "Find something worth helping with.",
  boundary: "Open Work is a request for help. It is not automatically a paid job, contract, MCU grant, or ownership grant.",
  empty: "No open Work has been posted yet.",
} as const;

export const missionismHubCopy = {
  title: "Missionism",
  relationship: "99pct uses Missionism as its organizational protocol. 99pct is the product; Missionism is the system underneath it.",
  links: [
    { href: "/principles", label: "Principles" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/why-now", label: "Why Now" },
    { href: "/specification", label: "Specification" },
    { href: "/open-questions", label: "Open Questions" },
    { href: "/changes", label: "Changes" },
  ],
} as const;
