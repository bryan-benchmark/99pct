/**
 * Locked public Missionism definitions and brand lines.
 * Keep this file tiny. Tone rules, avoid lists, and examples live in
 * docs/proposals/MISSIONISM_COMMUNICATION.md — not here.
 */

/** Verbatim answer to “What is Missionism?” on any surface page. */
export const shortDefinition =
  "Missionism is a better way to organize work. The people building an organization progressively own it, help steer it, and stay aligned around a shared mission.";

export const longDefinition =
  "Missionism is an open operating system for organizations where ownership is continually earned by the people creating value, authority follows responsibility, and the institution is designed around accomplishing its mission over generations.";

export const tagline = {
  line1: "Own your work.",
  line2: "Own your life.",
} as const;

export const brandLines = {
  organizeWork: "A better way to organize work.",
  ownSteerServe: "Own it. Steer it. Serve the mission.",
  triadPlain: "Employee owned. Employee navigated. Systematically aligned.",
  triadTechnical: "OWNERSHIP · AGENCY · ALIGNMENT",
  missionIsBoss: "The mission is the boss.",
  noHeroes: "Good systems shouldn't require heroes.",
  weComeInPeace: "We come in peace.",
} as const;

/** Layered category labels — attach immediately when introducing the word. */
export const categoryLabels = {
  public: "A better way to organize work.",
  business: "An employee-owned operating model for companies.",
  technical: "An open system for aligning mission, ownership, authority, compensation, and work.",
  mishys: "The platform for building and operating organizations on Missionism.",
  certification: "An open organizational standard.",
} as const;
