import { randomUUID } from "node:crypto";
import { readWorkspaceSnapshot, requireWorkspacePermission } from "./access";
import type { WorkspaceDb } from "./db/client";
import { WorkspaceError } from "./organizations";

export const contractQuestions = {
  worldState: "What world state are we trying to create?",
  measure: "How will we know we are getting closer?",
  beneficiaries: "Who benefits?",
  potentialHarms: "Who could be harmed?",
  causalTheory: "What do we currently believe drives the outcome?",
  contraryEvidence: "What evidence would make us change our minds?",
  valueSharing: "How is created value shared?",
} as const;

export type ContractAnswers = Record<keyof typeof contractQuestions, string>;
export type ContractRevision = { revision: number; author_id: string; status: "draft" | "submitted"; answers: ContractAnswers; created_at: Date | string };

export function parseContractAnswers(value: unknown, status: "draft" | "submitted" = "submitted"): ContractAnswers {
  if (!value || typeof value !== "object") throw new WorkspaceError(400, "Complete the Mission Contract.");
  const input = value as Record<string, unknown>;
  const answers = {} as ContractAnswers;
  for (const key of Object.keys(contractQuestions) as (keyof ContractAnswers)[]) {
    const raw = input[key];
    if (typeof raw !== "string" || (status === "submitted" && !raw.trim()) || raw.trim().length > 1000) throw new WorkspaceError(400, `Complete ${contractQuestions[key]} using 1,000 characters or fewer.`);
    answers[key] = raw.trim();
  }
  return answers;
}

export async function getContractRevisions(db: WorkspaceDb, orgId: string, actorId: string): Promise<ContractRevision[]> {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const result = await tx.query<ContractRevision>(
      "SELECT revision, author_id, status, answers, created_at FROM contract_revisions WHERE org_id = $1 ORDER BY revision DESC",
      [orgId],
    );
    return result.rows;
  });
}

export async function getContractRevision(db: WorkspaceDb, orgId: string, actorId: string, revision: number): Promise<ContractRevision | null> {
  return readWorkspaceSnapshot(db, orgId, actorId, "read", async (tx) => {
    const result = await tx.query<ContractRevision>(
      "SELECT revision, author_id, status, answers, created_at FROM contract_revisions WHERE org_id = $1 AND revision = $2",
      [orgId, revision],
    );
    return result.rows[0] || null;
  });
}

export async function saveContractRevision(db: WorkspaceDb, orgId: string, actorId: string, expectedRevision: number, status: "draft" | "submitted", answers: unknown) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new WorkspaceError(400, "Invalid expected revision.");
  if (status !== "draft" && status !== "submitted") throw new WorkspaceError(400, "Choose draft or submitted.");
  const validAnswers = parseContractAnswers(answers, status);
  return db.transaction(async (tx) => {
    const org = await tx.query("SELECT id FROM organizations WHERE id = $1 FOR UPDATE", [orgId]);
    if (!org.rows.length) throw new WorkspaceError(404, "Workspace not found.");
    await requireWorkspacePermission(tx, orgId, actorId, "edit_contract");
    const latest = await tx.query<{ revision: number }>("SELECT revision FROM contract_revisions WHERE org_id = $1 ORDER BY revision DESC LIMIT 1", [orgId]);
    const currentRevision = latest.rows[0]?.revision || 0;
    if (currentRevision !== expectedRevision) throw new WorkspaceError(409, "The Mission Contract changed. Reload before saving.");
    const revision = currentRevision + 1;
    await tx.query("INSERT INTO contract_revisions(org_id, revision, author_id, status, answers) VALUES ($1, $2, $3, $4, $5)", [orgId, revision, actorId, status, JSON.stringify(validAnswers)]);
    await tx.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, revision, payload) VALUES ($1, $2, $3, 'contract', $4, $5, $6, $7)", [randomUUID(), orgId, actorId, orgId, status === "submitted" ? "contract.submitted" : "contract.drafted", revision, JSON.stringify({ status })]);
    return { revision, status };
  });
}
