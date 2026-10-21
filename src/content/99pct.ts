/**
 * 99pct product-shell copy.
 * Missionism definitions stay in voice.ts. This file does not redefine them.
 */

export const productCopy = {
  name: "99pct",
  mark: "99%",
  description: "Join an open-source community and help build everyday utilities for the 99%, by the 99%.",
  eyebrow: "Built by the 99%, for the 99%.",
  headline: "The Taylor's version of Uber, Airbnb, DoorDash, and the rest.",
  gloss: "A version made by the people who do the work.",
  lede: "99pct is a place to join an open-source community and help build an everyday utility. A ride. A delivery. A stay. A song. A shop. The ordinary services of a life.",
  split: {
    caption: "Where the profit goes",
    rows: [
      { share: "~99%", who: "The people doing the work, on site" },
      { share: "~1%", who: "The people who keep the infrastructure running" },
      { share: "0%", who: "Outside owners" },
    ],
  },
  argument: "Helping is free. This site does not pay anyone, sell shares, or grant ownership.",
  truth: "No utility is a live service yet. You do not need to know how open source works. Join, pick one, and help.",
  join: { href: "/sign-in?mode=create&next=/use/rideshare-99", label: "Join today" },
  use: { href: "/use", label: "See the utilities" },
  build: { href: "/work", label: "Help with work" },
  start: { href: "/missions/new", label: "Start a utility" },
  explore: { href: "/missions", label: "See what has been started" },
  help: { href: "/help", label: "How helping works" },
  protocolLink: { href: "/missionism", label: "Missionism, the protocol underneath" },
  source: { href: "https://github.com/bryan-benchmark/99pct", label: "Source (AGPL-3.0)" },
  footerMark: "99pct · For the 99%, by the 99%.",
  footerTruth: "A place to help build open utilities for everyday life.",
} as const;

export const useCopy = {
  title: "Utilities",
  lede: "Everyday services a community can build in the open. Pick one and start it, or help if someone already has.",
  empty: "No 99pct utilities are live yet. We are building the shared infrastructure first.",
  substrate: "Starting one creates a public page for the community. It does not launch the service, a company, or a fundraiser.",
  build: { href: "/help", label: "How to help" },
} as const;

export const helpCopy = {
  title: "Help",
  lede: "You do not need to know how open source works.",
  free: "Helping is free. It is not a job offer.",
  steps: [
    {
      title: "Join",
      body: "An email and a password. Verify the email. That is the whole account. You can browse without one.",
      href: "/sign-in?mode=create&next=/help",
      label: "Join",
    },
    {
      title: "Start a utility",
      body: "Pick one from the list, or name one that is missing. You say what it is, who it is for, and where it starts. Then you post the work it needs and invite people who offer to help. That is how a person looks after a utility: they keep the list of what is needed, and they say yes to the people who will do it.",
      href: "/use",
      label: "See the utilities",
    },
    {
      title: "Do a piece of work",
      body: "Open work is a public request. It might be writing, design, answering people, testing, organizing one place, or code. You say you can help. The person who posted it can invite you. You confirm. Then you do it. There is no separate ticket system. The work list is the list.",
      href: "/work",
      label: "See open work",
    },
    {
      title: "Change the software",
      body: "The source is public. If you write code, you can send a change. If you do not, you can still say what should exist by starting a utility or by doing a piece of work.",
      href: "https://github.com/bryan-benchmark/99pct",
      label: "Source (AGPL-3.0)",
    },
  ],
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
