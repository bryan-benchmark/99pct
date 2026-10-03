import { randomUUID } from "node:crypto";
import { readWorkspaceSnapshot, requireIndependentReviewer, requireWorkspacePermission } from "./access";
import type { WorkspaceDb } from "./db/client";
import { WorkspaceError } from "./organizations";
import { reviewGateQuestions, type ReviewGateKey, type ReviewGateAssessment } from "./review-gates";

// Product form for operating decisions. Questions follow spec/DECISION_COMPILER.md;
// this record does not score a decision or grant constitutional authority.
export const decisionQuestions = {
  human: "How do contributors gain or lose?",
  company: "How does this affect organizational durability and economics?",
  beneficiary: "How does the beneficiary's net value change?",
  mission: "Which mission outcomes move, and in which direction?",
  humanExposure: "What human burden or exposure changes?",
  externalities: "Who outside the direct transaction is helped or harmed?",
  capital: "What cash, debt, dilution, or future obligation is consumed?",
  futureContributors: "How does this affect people who join later?",
  freedomExit: "Does this change switching freedom or the ability to leave?",
  resilience: "What concentration or single-point-of-failure risk changes?",
  reversibility: "How could this be undone if it is wrong?",
  evidence: "What is known, guessed, and worth testing?",
  gaming: "What happens if everyone optimizes this rule for themselves?",
  missionDrift: "What happens if this is repeated for ten years?",
  opportunityCost: "What better option are we giving up?",
} as const;

export function parseReviewGates(value: unknown): ReviewGateAssessment {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new WorkspaceError(400, "Assess all seven decision hard gates.");
  const input = value as Record<string, unknown>;
  const keys = Object.keys(reviewGateQuestions) as ReviewGateKey[];
  if (Object.keys(input).length !== keys.length || Object.keys(input).some((key) => !keys.includes(key as ReviewGateKey))) throw new WorkspaceError(400, "Assess all seven decision hard gates.");
  const gates = {} as ReviewGateAssessment;
  for (const key of keys) {
    const item = input[key];
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new WorkspaceError(400, `Assess: ${reviewGateQuestions[key]}`);
    const data = item as Record<string, unknown>;
    const status = data.status;
    const note = typeof data.note === "string" ? data.note.trim() : "";
    if (status !== "clear" && status !== "unresolved" && status !== "triggered") throw new WorkspaceError(400, `Assess: ${reviewGateQuestions[key]}`);
    if (note.length > 500 || (status !== "clear" && !note)) throw new WorkspaceError(400, `Explain any unresolved or triggered gate: ${reviewGateQuestions[key]}`);
    gates[key] = { status, note };
  }
  return gates;
}

export type DecisionLenses = Record<keyof typeof decisionQuestions, string>;
export type DecisionContent = { title: string; action: string; lenses: DecisionLenses; evidenceReferences: string[] };
export type DecisionRevision = { revision: number; author_id: string; status: "draft" | "submitted"; content: DecisionContent; created_at: Date | string };

export function parseDecisionContent(value: unknown, status: "draft" | "submitted"): DecisionContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new WorkspaceError(400, "Enter a decision record.");
  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const action = typeof input.action === "string" ? input.action.trim() : "";
  if (!title || title.length > 160) throw new WorkspaceError(400, "Enter a decision title using 160 characters or fewer.");
  if (status === "submitted" && !action || action.length > 2000) throw new WorkspaceError(400, "Describe the proposed action using 2,000 characters or fewer.");
  const rawLenses = input.lenses && typeof input.lenses === "object" && !Array.isArray(input.lenses) ? input.lenses as Record<string, unknown> : {};
  const lenses = {} as DecisionLenses;
  for (const key of Object.keys(decisionQuestions) as (keyof DecisionLenses)[]) {
    const value = rawLenses[key];
    const answer = typeof value === "string" ? value.trim() : "";
    if ((status === "submitted" && !answer) || answer.length > 1500) throw new WorkspaceError(400, `Answer ${decisionQuestions[key]} using 1,500 characters or fewer.`);
    lenses[key] = answer;
  }
  const references = input.evidenceReferences === undefined ? [] : input.evidenceReferences;
  if (!Array.isArray(references) || references.length > 10 || references.some((item) => typeof item !== "string" || item.length > 500 || !/^https?:\/\/\S+$/i.test(item))) throw new WorkspaceError(400, "Use up to ten HTTP or HTTPS evidence links.");
  return { title, action, lenses, evidenceReferences: references };
}

export async function createDecision(db: WorkspaceDb, orgId: string, actorId: string, contractRevision: number, status: "draft" | "submitted", content: unknown) {
  if (!Number.isSafeInteger(contractRevision) || contractRevision < 1) throw new WorkspaceError(400, "Choose a submitted Mission Contract revision.");
  if (status !== "draft" && status !== "submitted") throw new WorkspaceError(400, "Choose draft or submitted.");
  const valid = parseDecisionContent(content, status);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    await requireWorkspacePermission(tx, orgId, actorId, "propose_decision");
    const contract = await tx.query<{ status: string }>("SELECT status FROM contract_revisions WHERE org_id = $1 AND revision = $2", [orgId, contractRevision]);
    if (contract.rows[0]?.status !== "submitted") throw new WorkspaceError(409, "Choose a submitted Mission Contract revision.");
    await tx.query("INSERT INTO decisions(org_id, id, contract_revision, created_by) VALUES ($1, $2, $3, $4)", [orgId, id, contractRevision, actorId]);
    await tx.query("INSERT INTO decision_revisions(org_id, decision_id, revision, author_id, status, content) VALUES ($1, $2, 1, $3, $4, $5)", [orgId, id, actorId, status, JSON.stringify(valid)]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, revision, payload) VALUES ($1, $2, $3, 'decision', $4, $5, 1, $6)", [randomUUID(), orgId, actorId, id, status === "submitted" ? "decision.submitted" : "decision.drafted", JSON.stringify({ contractRevision, status })]);
  });
  return { id, revision: 1, status };
}

export async function saveDecisionRevision(db: WorkspaceDb, orgId: string, decisionId: string, actorId: string, expectedRevision: number, status: "draft" | "submitted", content: unknown) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new WorkspaceError(400, "Invalid expected revision.");
  if (status !== "draft" && status !== "submitted") throw new WorkspaceError(400, "Choose draft or submitted.");
  const valid = parseDecisionContent(content, status);
  return db.transaction(async (tx) => {
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    await requireWorkspacePermission(tx, orgId, actorId, "propose_decision");
    const decision = await tx.query("SELECT id FROM decisions WHERE org_id = $1 AND id = $2", [orgId, decisionId]);
    if (!decision.rows.length) throw new WorkspaceError(404, "Decision not found.");
    const latest = await tx.query<{ revision: number }>("SELECT revision FROM decision_revisions WHERE org_id = $1 AND decision_id = $2 ORDER BY revision DESC LIMIT 1", [orgId, decisionId]);
    if (latest.rows[0]?.revision !== expectedRevision) throw new WorkspaceError(409, "The decision changed. Reload before saving.");
    const revision = expectedRevision + 1;
    await tx.query("INSERT INTO decision_revisions(org_id, decision_id, revision, author_id, status, content) VALUES ($1, $2, $3, $4, $5, $6)", [orgId, decisionId, revision, actorId, status, JSON.stringify(valid)]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, revision, payload) VALUES ($1, $2, $3, 'decision', $4, $5, $6, $7)", [randomUUID(), orgId, actorId, decisionId, status === "submitted" ? "decision.submitted" : "decision.drafted", revision, JSON.stringify({ status, priorRevision: expectedRevision })]);
    return { id: decisionId, revision, status };
  });
}

export async function reviewDecision(db: WorkspaceDb, orgId: string, decisionId: string, reviewerId: string, revision: number, disposition: "approved" | "rejected", reasonInput: string, gatesInput: unknown) {
  const reason = reasonInput.trim();
  if (!Number.isSafeInteger(revision) || revision < 1) throw new WorkspaceError(400, "Choose a submitted revision.");
  if (disposition !== "approved" && disposition !== "rejected") throw new WorkspaceError(400, "Choose approve or reject.");
  if (!reason || reason.length > 2000) throw new WorkspaceError(400, "Explain the review using 2,000 characters or fewer.");
  const gates = parseReviewGates(gatesInput);
  if (disposition === "approved" && Object.values(gates).some((gate) => gate.status !== "clear")) throw new WorkspaceError(400, "Resolve every hard gate before approving, or reject this revision.");
  await db.transaction(async (tx) => {
    await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    await requireIndependentReviewer(tx, orgId, reviewerId, decisionId, revision);
    const latest = await tx.query<{ revision: number }>("SELECT revision FROM decision_revisions WHERE org_id = $1 AND decision_id = $2 ORDER BY revision DESC LIMIT 1", [orgId, decisionId]);
    if (latest.rows[0]?.revision !== revision) throw new WorkspaceError(409, "A newer decision revision exists. Review that revision instead.");
    const previous = await tx.query("SELECT 1 FROM decision_reviews WHERE org_id = $1 AND decision_id = $2 AND revision = $3", [orgId, decisionId, revision]);
    if (previous.rows.length) throw new WorkspaceError(409, "This revision has already been reviewed.");
    await tx.query("INSERT INTO decision_reviews(org_id, decision_id, revision, reviewer_id, disposition, reason, gates) VALUES ($1, $2, $3, $4, $5, $6, $7)", [orgId, decisionId, revision, reviewerId, disposition, reason, JSON.stringify(gates)]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, revision, payload) VALUES ($1, $2, $3, 'review', $4, $5, $6, $7)", [randomUUID(), orgId, reviewerId, decisionId, `decision.${disposition}`, revision, JSON.stringify({ reason, gates })]);
  });
  return { decisionId, revision, disposition };
}

export async function listDecisions(db: WorkspaceDb, orgId: string, actorId: string) {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const result = await tx.query<{ id: string; contract_revision: number; created_by: string; latest_revision: number; status: string; title: string; disposition: string | null }>(
      "SELECT d.id, d.contract_revision, d.created_by, r.revision AS latest_revision, r.status, r.content->>'title' AS title, v.disposition FROM decisions d JOIN LATERAL (SELECT revision, status, content FROM decision_revisions WHERE org_id = d.org_id AND decision_id = d.id ORDER BY revision DESC LIMIT 1) r ON true LEFT JOIN decision_reviews v ON v.org_id = d.org_id AND v.decision_id = d.id AND v.revision = r.revision WHERE d.org_id = $1 ORDER BY d.created_at DESC, d.id",
      [orgId],
    );
    return result.rows;
  });
}

export async function getDecisionRecord(db: WorkspaceDb, orgId: string, decisionId: string, actorId: string) {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const decision = await tx.query<{ id: string; contract_revision: number; created_by: string }>("SELECT id, contract_revision, created_by FROM decisions WHERE org_id = $1 AND id = $2", [orgId, decisionId]);
    if (!decision.rows[0]) throw new WorkspaceError(404, "Decision not found.");
    const revisions = await tx.query<DecisionRevision>("SELECT revision, author_id, status, content, created_at FROM decision_revisions WHERE org_id = $1 AND decision_id = $2 ORDER BY revision DESC", [orgId, decisionId]);
    const reviews = await tx.query<{ revision: number; reviewer_id: string; disposition: "approved" | "rejected"; reason: string; gates: ReviewGateAssessment | null; created_at: Date | string }>("SELECT revision, reviewer_id, disposition, reason, gates, created_at FROM decision_reviews WHERE org_id = $1 AND decision_id = $2 ORDER BY revision DESC", [orgId, decisionId]);
    return { ...decision.rows[0], revisions: revisions.rows, reviews: reviews.rows };
  });
}
