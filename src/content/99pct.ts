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
  artist: "Good artists copy. Great artists steal.",
  artistBy: "Picasso",
  gloss: "A version where the people who do the work keep all of the profits.",
  stop: "Let's just stop giving our money to them.",
  rules: [
    "99% of profits stay in the communities they are earned in.",
    "99% of a ride stays with the person who drove.",
    "99% of a night stays with the person who hosted.",
    "99% of a delivery stays with the person who carried it.",
    "99% of a post stays with the person who made it.",
    "No more things made to break.",
    "Built to last, for the 99%.",
    "1% keeps the shared infrastructure running.",
    "0% goes to outside owners.",
  ],
  lede: "Come help build the version you would actually use. A ride. A delivery. A place to stay. A post. Pick one small piece and do it. Your name stays on it.",
  intro: {
    title: "Come in this way",
    steps: [
      "Join with an email.",
      "Pick one piece. You do not need to write code.",
      "Do that piece, and post what you did.",
      "Your name stays on it. That credit is an MCU.",
      "An MCU is not money and it is not a share.",
      "The next piece is open for the next person.",
    ],
  },
  mcu: {
    title: "MCUs",
    meaning: "An MCU is your name on a piece of work. It is not money and it is not a share.",
    empty: "No names yet. Yours can be the first.",
    href: "/mcus",
    label: "See the names",
  },
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
      body: "An email and a password. Verify the email. That is the whole account. You can look around without one.",
      href: "/sign-in?mode=create&next=/use/rideshare-99",
      label: "Join",
    },
    {
      title: "Pick one piece",
      body: "Start with Rideshare 99. Write the page, name the city, make a list, or sketch the screen. You do not need to write code.",
      href: "/use/rideshare-99",
      label: "See the pieces",
    },
    {
      title: "Do it",
      body: "Do the piece you picked, then post what you did. If you write code, you can send a change instead. Either one counts.",
      href: "/use/rideshare-99#help",
      label: "I can help",
    },
    {
      title: "Your name stays",
      body: "The name you post is public. It stays on that piece, and on a page that is yours.",
      href: "/mcus",
      label: "See the names",
    },
    {
      title: "That credit is an MCU",
      body: "An MCU is your name on a piece of work. It is not money and it is not a share. This site does not pay anyone, sell shares, or grant ownership.",
      href: "/mcus",
      label: "What an MCU is",
    },
    {
      title: "The next piece opens",
      body: "When a piece is posted, the next one is there for the next person. That is how a utility grows.",
      href: "/work",
      label: "See open work",
    },
  ],
} as const;

export const findWorkCopy = {
  title: "Find Work",
  lede: "Pieces people can do. Pick one.",
  boundary: "Helping is free. This is not a job, a paycheck, or ownership.",
  empty: "Nothing is open yet.",
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
