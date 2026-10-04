/**
 * Mishys Talent OS — proposed domain types.
 *
 * Status: Proposed / Experimental. Not Canonical.
 * Phase 0: interfaces only — no persistence, providers, or MU minting.
 *
 * See docs/proposals/MISHYS_TALENT_OS.md
 *
 * Integration boundary:
 *   talent facts / finalized outcome evidence → outcome MU kernel
 * Talent must not directly mint arbitrary MU.
 */

// ---------------------------------------------------------------------------
// Founder boundaries (Phase 0 — must remain true in Phase 1+)
// ---------------------------------------------------------------------------

/**
 * Structural promises. No primitive silently owns another.
 * Phase 1 turns these into executable transitions; do not fake them.
 */
export const TALENT_OS_FOUNDER_BOUNDARIES = {
  /**
   * Grade never mutates authority, compensation, MU, or billet assignment by itself.
   * Those relationships require explicit AuthorityGrant / CompensationElection /
   * outcome-MU kernel / Billet assignment + DecisionReceipt.
   */
  GRADE_DOES_NOT_IMPLICITLY_OWN_OTHERS: true,

  /**
   * Qualification and promotion are distinct. A contributor may be QUALIFIED
   * for G5 indefinitely while currentGrade remains G4 until real G5 scope
   * exists, is assigned, accepted, and sealed by a GRADE_PROMOTION receipt.
   */
  QUALIFICATION_NE_PROMOTION: true,

  /**
   * PerformanceException → evidence only.
   * Validated DeliveryMiss cluster → GradeReview.
   * Only a finalized GRADE_PROMOTION / GRADE_REDUCTION DecisionReceipt
   * may change currentGrade / trusted scope.
   */
  PERFORMANCE_EXCEPTION_CANNOT_MUTATE_GRADE: true,

  /**
   * DecisionReceipt is the shared append-only audit spine for consequential
   * talent decisions (promotion, authority, grade reduction, compensation
   * election, verified automation, strike, appeal, etc.).
   */
  DECISION_RECEIPT_IS_AUDIT_SPINE: true,

  /**
   * G1–G7 is Mishys Experimental implementation of "explicit trusted scope."
   * Not required by Canonical Missionism. Ladder size may change with evidence.
   */
  GRADE_LADDER_IS_MISHYS_EXPERIMENTAL: true,
} as const;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Mishys Experimental trusted-scope ladder (v0.1).
 * Exactly seven grades for this experiment — no subgrades.
 * NOT Canonical Missionism; the transferable principle is explicit trusted scope.
 *
 * Grade alone never grants AuthorityGrant, CompensationElection, MU, or a Billet.
 */
export type Grade = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";

/**
 * Kind of contribution. Same grade = comparable scope / blast radius;
 * different required evidence. Neither track is intrinsically above the other.
 */
export type Track = "BUILDER" | "STEWARD";

/** Human involvement classification — constrains automation. */
export type HumanValue =
  | "INCIDENTAL"
  | "USEFUL"
  | "IMPORTANT"
  | "ESSENTIAL";

export type PolicyVersion = string;

export type ActorRef = {
  kind: "PERSON" | "SYSTEM" | "PANEL" | "AI_ADVISOR";
  id: string;
  /** Display name for receipts; AI actors may advise but must not finalize adverse employment. */
  label?: string;
};

// ---------------------------------------------------------------------------
// Grade semantics (documentation constants — not runtime authority)
// ---------------------------------------------------------------------------

/** Experimental labels for the Mishys G1–G7 ladder. Not Canonical doctrine. */
export const GRADE_SCOPE: Record<Grade, string> = {
  G1: "Execute bounded work",
  G2: "Own an outcome",
  G3: "Own a system",
  G4: "Own a mission slice",
  G5: "Own a major mission outcome / function",
  G6: "Own multiple mission systems",
  G7: "Institutional steward",
};

// ---------------------------------------------------------------------------
// Capabilities & evidence
// ---------------------------------------------------------------------------

export type CapabilityRequirement = {
  capabilityId: string;
  minimumLevel?: string;
  required: boolean;
};

export type CapabilityEvidence = {
  capabilityId: string;
  level: string;
  verified: boolean;
  evidenceIds: string[];
  verifiedAt?: string;
};

export type TagEvidence = {
  tag: string;
  level?: string;
  /** Self-claim vs verified must never be collapsed. */
  source: "SELF_CLAIM" | "VERIFIED";
  evidenceIds: string[];
};

export type Evidence = {
  id: string;
  subjectId: string;
  kind:
    | "RAW_METRIC"
    | "DOCUMENT"
    | "ASSESSMENT"
    | "SIMULATION"
    | "PEER_FEEDBACK"
    | "SUBORDINATE_FEEDBACK"
    | "CUSTOMER_FEEDBACK"
    | "WORK_ARTIFACT"
    | "SYSTEM_EVENT";
  occurredAt: string;
  collectedAt: string;
  source: string;
  sourceHash?: string;
  confidence?: number;
  visibility: "PRIVATE" | "ORG" | "PUBLIC";
  immutable: boolean;
};

export type AssessmentResult = {
  id: string;
  assessmentKind: string;
  gradeTarget?: Grade;
  track?: Track;
  score?: number;
  passed?: boolean;
  evidenceIds: string[];
  occurredAt: string;
  policyVersion: PolicyVersion;
};

// ---------------------------------------------------------------------------
// Authority
// ---------------------------------------------------------------------------

export type AuthorityKind =
  | "SPEND"
  | "HIRE"
  | "TERMINATE"
  | "SIGN_CONTRACT"
  | "CHANGE_POLICY"
  | "DEPLOY"
  | "ACCESS_DATA";

/**
 * Actual power is granted explicitly on a billet — never implied by Grade alone.
 */
export type AuthorityGrant = {
  id: string;
  billetId: string;
  authority: AuthorityKind;
  limit?: number;
  scope?: string[];
  effectiveAt: string;
  expiresAt?: string;
  policyVersion: PolicyVersion;
  grantedByReceiptId: string;
};

// ---------------------------------------------------------------------------
// Billet & outcome contract reference
// ---------------------------------------------------------------------------

export type BilletStatus =
  | "DRAFT"
  | "OPEN"
  | "MATCHED"
  | "ACTIVE"
  | "CLOSED"
  | "VOIDED";

/**
 * What mission responsibility currently needs an owner —
 * not a permanent title or task list.
 */
export type Billet = {
  id: string;
  missionId: string;
  missionSliceId?: string;
  name: string;
  track: Track;
  minimumGrade: Grade;
  maximumGrade?: Grade;
  purpose: string;
  /** References existing outcome / scorecard policy — does not redefine MU math. */
  outcomeContractTemplateId: string;
  requiredCapabilities: CapabilityRequirement[];
  preferredCapabilities: CapabilityRequirement[];
  authorityTemplateId: string;
  humanValue: HumanValue;
  status: BilletStatus;
  policyVersion: PolicyVersion;
  /** Conventional display label only — not system truth. */
  displayTitle?: string;
};

/**
 * Outcome contract shape attached to a billet/epoch.
 * Semantics: FLOOR miss may be delivery miss; TARGET miss is not a strike;
 * STRETCH miss has zero negative consequence.
 */
export type OutcomeContract = {
  id: string;
  billetId: string;
  epochId: string;
  whyThisRoleExists: string;
  floor: string;
  target: string;
  stretch: string;
  guardrails: string[];
  rawFactSources: string[];
  /** Scorecard / outcome policy version from MU kernel. */
  outcomePolicyVersion: PolicyVersion;
  policyVersion: PolicyVersion;
};

// ---------------------------------------------------------------------------
// Work leverage
// ---------------------------------------------------------------------------

export type WorkTaskState =
  | "COMPLETE"
  | "IMPROVE"
  | "AUTOMATE"
  | "ELIMINATE"
  | "CHALLENGE";

export type WorkBaseline = {
  humanHoursPerPeriod?: number;
  qualityNotes?: string;
  safetyNotes?: string;
  complianceNotes?: string;
  customerEffortNotes?: string;
  maintenanceHoursPerPeriod?: number;
};

/**
 * Proof required for IMPROVE / AUTOMATE / ELIMINATE.
 * Burden shifting is not elimination. Leverage remains shadow-scored in v0.1.
 */
export type WorkTransformationProof = {
  transformationId: string;
  taskId: string;
  kind: "IMPROVE" | "AUTOMATE" | "ELIMINATE";
  baseline: WorkBaseline;
  after: WorkBaseline;
  observationWindowStart: string;
  observationWindowEnd: string;
  outcomePreserved: boolean;
  qualityPreserved: boolean;
  safetyPreserved: boolean;
  compliancePreserved: boolean;
  totalHumanLaborReduced: boolean;
  downstreamBurdenDelta: number;
  customerBurdenDelta: number;
  maintenanceBurdenDelta: number;
  fallbackDefined: boolean;
  evidenceIds: string[];
  humanValueAtTask: HumanValue;
  /** Explicit override required if humanValue is ESSENTIAL and kind is ELIMINATE. */
  essentialOverrideReceiptId?: string;
  status: "PROPOSED" | "OBSERVING" | "VERIFIED" | "REJECTED";
  /** Shadow leverage credit — not irreversible MU. */
  shadowLeverageCredit?: number;
};

// ---------------------------------------------------------------------------
// Service & talent profile
// ---------------------------------------------------------------------------

export type GradeHistoryEntry = {
  grade: Grade;
  track: Track;
  effectiveAt: string;
  receiptId: string;
  kind: "QUALIFIED" | "PROMOTED" | "REDUCED" | "ENTERED";
};

export type ServiceRecord = {
  personId: string;
  organizationId: string;
  serviceStart: string;
  serviceEnd?: string;
  completedEpochs: number;
  successfulEpochs: number;
  billetsHeld: string[];
  missionsServed: string[];
  gradeHistory: GradeHistoryEntry[];
};

export type ServiceSummary = {
  yearsOfService: number;
  completedEpochs: number;
  successfulEpochs: number;
  /** Machine-computed: floors met / eligible finalized epochs. Evidence, not total human value. */
  reliability?: { met: number; eligible: number };
};

export type CareerGoal = {
  id: string;
  description: string;
  desiredGrade?: Grade;
  desiredTrack?: Track;
  desiredMissions?: string[];
};

export type TalentProfile = {
  personId: string;
  grade: Grade;
  track: Track;
  specialty?: string;
  verifiedCapabilities: CapabilityEvidence[];
  knowledge: TagEvidence[];
  skills: TagEvidence[];
  behaviors: TagEvidence[];
  preferences: {
    missions: string[];
    problemTypes: string[];
    workModes: string[];
    location?: string[];
    compensationRisk?: string[];
    desiredTracks?: Track[];
  };
  benchmarkAssessments: AssessmentResult[];
  service: ServiceSummary;
  careerGoals: CareerGoal[];
  desiredNextGrade?: Grade;
};

// ---------------------------------------------------------------------------
// Qualification & promotion
// ---------------------------------------------------------------------------

/**
 * Path toward a *specific* targetGrade + track.
 * QUALIFIED does not change currentGrade. PROMOTED is only after a
 * GRADE_PROMOTION DecisionReceipt seals acceptance of real scope.
 *
 * Example: currentGrade G4 + state QUALIFIED + targetGrade G5
 * may persist indefinitely ("QUALIFIED_G5") with no promotion.
 */
export type QualificationState =
  | "NOT_READY"
  | "ELIGIBLE_FOR_ASSESSMENT"
  | "QUALIFIED"
  | "WAITING_FOR_SCOPE"
  | "ASSIGNED_TO_BILLET"
  | "PROMOTED";

export type GradeRequirementKind =
  | "CAPABILITY"
  | "OUTCOME_HISTORY"
  | "SERVICE_EVIDENCE"
  | "SIMULATION"
  | "ACTING_BILLET"
  | "MULTISOURCE_FEEDBACK"
  | "MISSION_IMPACT";

export type GradeRequirement = {
  id: string;
  grade: Grade;
  track: Track;
  kind: GradeRequirementKind;
  /** Threshold shape left open — not constitutionalized in Phase 0. */
  threshold: unknown;
  description: string;
};

export type GradeReadiness = {
  personId: string;
  /** Actual trusted scope today — unchanged by QUALIFIED alone. */
  currentGrade: Grade;
  /** Grade being proven toward (e.g. G5 while currentGrade is G4). */
  targetGrade: Grade;
  track: Track;
  state: QualificationState;
  requirements: Array<{
    requirementId: string;
    satisfied: boolean;
    evidenceIds: string[];
  }>;
  percentEvidenceComplete: number;
  explanation: string;
  policyVersion: PolicyVersion;
  /** Set only when state === PROMOTED; must reference GRADE_PROMOTION receipt. */
  promotionReceiptId?: string;
};

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

/**
 * Evidence of a controllable floor miss. Never carries a grade field.
 * Does not mutate currentGrade. Feeds GradeReview when clustered/validated.
 */
export type DeliveryMiss = {
  kind: "DELIVERY_MISS";
  id: string;
  personId: string;
  billetId: string;
  epochId: string;
  evidenceIds: string[];
  validated: boolean;
  receiptId?: string;
};

/**
 * Forecast/risk-profile miss while meeting floor. Not a delivery strike.
 * Never mutates grade.
 */
export type CalibrationMiss = {
  kind: "CALIBRATION_MISS";
  id: string;
  personId: string;
  billetId: string;
  epochId: string;
  evidenceIds: string[];
  receiptId?: string;
};

/**
 * Company/system prevented delivery. Never a strike; never mutates grade.
 */
export type SystemBlocker = {
  kind: "SYSTEM_BLOCKER";
  id: string;
  personId: string;
  billetId: string;
  epochId: string;
  reason: string;
  evidenceIds: string[];
  receiptId?: string;
};

/**
 * Performance exceptions produce evidence / review triggers only.
 * They must not include grade mutation fields (enforced by type shape).
 */
export type PerformanceException =
  | DeliveryMiss
  | CalibrationMiss
  | SystemBlocker;

export type GradeReviewOutcome =
  | "NO_ACTION"
  | "ROLE_MISMATCH"
  | "SKILL_GAP"
  | "SCOPE_REDUCTION"
  | "EXIT";

/**
 * Intermediate boundary: misses → review; review recommendation → receipt.
 * Closing a review does not itself change grade until a GRADE_PROMOTION
 * or GRADE_REDUCTION DecisionReceipt is finalized (scopeCorrectionReceiptId).
 */
export type GradeReview = {
  id: string;
  personId: string;
  triggeredByMissIds: string[];
  /** Pilot default experimental: 3 validated misses / rolling 6 epochs. */
  windowEpochs: number;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  outcome?: GradeReviewOutcome;
  /** GRADE_REVIEW receipt documenting the review decision. */
  receiptId?: string;
  /**
   * If outcome implies scope change, the separate GRADE_REDUCTION /
   * GRADE_PROMOTION receipt that actually mutates currentGrade.
   */
  scopeCorrectionReceiptId?: string;
  policyVersion: PolicyVersion;
};

// ---------------------------------------------------------------------------
// Compensation
// ---------------------------------------------------------------------------

export type CompensationRiskProfile = "SAFE" | "STANDARD" | "AGGRESSIVE";

/**
 * Compensation belongs to billet/epoch, not Grade.
 * Risk profile changes allocation, not mission KPI difficulty.
 */
export type CompensationElection = {
  id: string;
  personId: string;
  billetId: string;
  epochId: string;
  guaranteedCash: number;
  riskProfile: CompensationRiskProfile;
  outcomePolicyVersion: PolicyVersion;
  selectedAt: string;
  /** Must be locked before outcomes for the epoch are known. */
  lockedAt: string;
};

// ---------------------------------------------------------------------------
// Decision receipts & appeals
// ---------------------------------------------------------------------------

export type DecisionReceiptType =
  | "BILLET_ASSIGNMENT"
  | "AUTHORITY_GRANT"
  | "COMPENSATION_ELECTION"
  | "DELIVERY_MISS"
  | "CALIBRATION_MISS"
  | "GRADE_QUALIFIED"
  | "GRADE_PROMOTION"
  | "GRADE_REDUCTION"
  | "WORK_TRANSFORMATION"
  | "CAPABILITY_VERIFICATION"
  | "APPEAL_DECISION"
  | "GRADE_REVIEW"
  | "SYSTEM_BLOCKER";

/**
 * Shared append-only audit spine for consequential talent decisions.
 * Promotion, authority, grade reduction, compensation election, verified
 * automation, strike, appeal, grade review — all terminate here.
 *
 * FINALIZED receipts are immutable. Corrections use REVERSAL + replacement.
 * Subsystems must not invent separate history semantics.
 */
export type DecisionReceipt = {
  id: string;
  organizationId: string;
  personId?: string;
  missionId?: string;
  billetId?: string;
  type: DecisionReceiptType;
  effectiveAt: string;
  decidedAt: string;
  policyVersion: PolicyVersion;
  algorithmVersion?: string;
  evidenceIds: string[];
  rawInputHash: string;
  decision: unknown;
  decidedBy: ActorRef[];
  explanation: string;
  status: "FINALIZED" | "REVERSED";
  reversesReceiptId?: string;
  replacementReceiptId?: string;
};

export type AppealClaim =
  | "FACT_ERROR"
  | "POLICY_MISAPPLIED"
  | "EVIDENCE_MISSING"
  | "CONFLICT_OF_INTEREST"
  | "OTHER";

export type Appeal = {
  id: string;
  receiptId: string;
  filedBy: string;
  claim: AppealClaim;
  evidenceIds: string[];
  status: "OPEN" | "REVIEWING" | "UPHELD" | "OVERTURNED" | "PARTIAL";
  reviewerIds: string[];
  finalReceiptId?: string;
};

// ---------------------------------------------------------------------------
// Matching & audit
// ---------------------------------------------------------------------------

export type MatchReason = {
  factor: string;
  satisfied: boolean;
  detail: string;
};

/** Never return a bare percentage without a reason vector. */
export type BilletMatch = {
  billetId: string;
  personId: string;
  matchPercent: number;
  reasons: MatchReason[];
  gaps: MatchReason[];
  algorithmVersion: string;
};

export type AuditFindingKind =
  | "COMPENSATION_GAMING"
  | "ATTRIBUTION_GAMING"
  | "AUTOMATION_GAMING"
  | "GRADE_GAMING"
  | "STRIKE_GAMING"
  | "MATCHING_BIAS"
  | "SCOPE_INFLATION"
  | "METRIC_COLLAPSE";

export type AuditFinding = {
  id: string;
  kind: AuditFindingKind;
  organizationId: string;
  subjectIds: string[];
  evidenceIds: string[];
  summary: string;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
  /** Findings are signals — not automatic punishment. */
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Open questions deliberately left unsettled (Phase 0)
// ---------------------------------------------------------------------------

/**
 * Not constitutionalized yet — see MISHYS_TALENT_OS.md §17.
 * Listed here so implementers do not invent silent defaults.
 */
export const TALENT_OS_OPEN_QUESTIONS = [
  "exact time-in-grade minimums",
  "exact strike window after Benchmark pilot",
  "universal leverage → MU conversion",
  "universal cash-to-MU mix by grade",
  "whether seven grades remain correct",
  "exact requirements for each specialty",
  "public reputation scoring",
  "cross-company portability of Grade",
  "cross-company portability of strikes",
  "whether organizations trust external Mishys Grade wholesale",
  "AI matching weights",
  "AI-generated behavioral scores",
  "automatic employment termination",
] as const;
