// Product review questions based on the design doctrine in spec/DECISION_COMPILER.md.
// "clear" is a human assessment, never a software certification.
export const reviewGateQuestions = {
  legality: "Is this illegal?",
  fraud: "Is this fraudulent?",
  closedEra: "Does this violate a closed Era?",
  contributorRights: "Does this violate an immutable contributor right?",
  humanSafety: "Does this create unacceptable safety or human-rights harm?",
  solvency: "Could this make the organization insolvent under its capital policy?",
  disclosure: "Would this require hiding material information from affected people?",
} as const;

export type ReviewGateKey = keyof typeof reviewGateQuestions;
export type ReviewGateAssessment = Record<ReviewGateKey, { status: "clear" | "unresolved" | "triggered"; note: string }>;
