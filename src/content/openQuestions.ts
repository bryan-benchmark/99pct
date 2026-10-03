import type { NonCanonicalMaturity } from "./protocolMeta";

export type OpenQuestion = {
  maturity: NonCanonicalMaturity;
  question: string;
};

export const openQuestionsIntro =
  "These are recognized problems. Missionism v0.1 does not claim to have solved them. Prefer evidence and experiments over premature doctrine.";

export const openQuestions: OpenQuestion[] = [
  {
    maturity: "open",
    question: "How should missions measure value?",
  },
  {
    maturity: "open",
    question:
      "How should Mission Units (Mishys product language) relate to MCU (protocol language)?",
  },
  {
    maturity: "open",
    question: "How much ownership should past contributors retain?",
  },
  {
    maturity: "open",
    question: "Can ownership cascade across generations?",
  },
  {
    maturity: "open",
    question: "How should child missions participate in parent governance?",
  },
  {
    maturity: "open",
    question:
      "Should missions receive equal representation or contribution-weighted representation?",
  },
  {
    maturity: "open",
    question: "How do we prevent large missions from capturing federations?",
  },
  {
    maturity: "open",
    question:
      "How do we prevent thousands of tiny missions from overwhelming governance?",
  },
  {
    maturity: "open",
    question:
      "How should trademarks and certification work with open-source forks?",
  },
  {
    maturity: "open",
    question:
      "What rights should always remain individual rather than contribution-weighted?",
  },
  {
    maturity: "open",
    question: "How should missions resolve disagreement?",
  },
  {
    maturity: "open",
    question: "When should a mission fork instead of voting?",
  },
  {
    maturity: "open",
    question:
      "Who may set reference values and multipliers without recreating founder capture (the oracle problem)?",
  },
  {
    maturity: "proposed",
    question:
      "Can Missionism measure whether a mechanism removes more coordination complexity than it adds—without recreating the bureaucracy it claims to compress?",
  },
  {
    maturity: "open",
    question:
      "How do we keep mission objectives legible enough to guide ownership without collapsing into thirty ambiguous scores worse than a single financial signal?",
  },
];
