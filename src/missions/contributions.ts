import { randomBytes, randomUUID } from "node:crypto";
import { firstRecognitionRule } from "@/economic/first-rule";
import type { MissionDb, MissionSql } from "./db/client";
import { InterestRequestError } from "./interest";

type WorkTarget = { id: string; status: string; creator_uid: string; mission_id: string };

const workTargetSql = `
  SELECT work_items.id, work_items.status, missions.creator_uid, missions.id AS mission_id
  FROM work_items
  JOIN projects ON projects.id = work_items.project_id
  JOIN missions ON missions.id = projects.mission_id
  WHERE missions.slug = $1 AND projects.slug = $2 AND work_items.slug = $3
`;

async function rememberHuman(tx: MissionSql, human: { uid: string; email: string }) {
  await tx.query(
    `INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)
     ON CONFLICT (firebase_uid) DO UPDATE SET verified_email = EXCLUDED.verified_email`,
    [human.uid, human.email],
  );
}

async function targetWork(db: Pick<MissionSql, "query">, missionSlug: string, projectSlug: string, workSlug: string) {
  const result = await db.query<WorkTarget>(workTargetSql, [missionSlug, projectSlug, workSlug]);
  const work = result.rows[0];
  if (!work || work.status !== "open") throw new InterestRequestError(404, "That work was not found.");
  return work;
}

async function confirmedHelper(tx: MissionSql, workId: string, uid: string) {
  const result = await tx.query<{ ok: number }>(
    `SELECT 1 AS ok
       FROM work_interests
       JOIN work_invitations ON work_invitations.interest_id = work_interests.id
       JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
      WHERE work_interests.work_id = $1 AND work_interests.human_uid = $2`,
    [workId, uid],
  );
  return result.rows.length > 0;
}

async function contributorRef(tx: MissionSql, uid: string) {
  const existing = await tx.query<{ contributor_ref: string }>("SELECT contributor_ref FROM contributor_refs WHERE firebase_uid = $1", [uid]);
  if (existing.rows[0]) return existing.rows[0].contributor_ref;
  const contributorRefValue = `contributor:${randomBytes(10).toString("hex")}`;
  await tx.query("INSERT INTO contributor_refs (firebase_uid, contributor_ref) VALUES ($1, $2)", [uid, contributorRefValue]);
  return contributorRefValue;
}

export type ContributionView = {
  id: string;
  summary: string;
  evidenceNote: string;
  recognized: boolean;
  amount: string | null;
  ruleId: string | null;
  ruleVersion: string | null;
};

export async function listWorkContributions(db: Pick<MissionDb, "query">, missionSlug: string, projectSlug: string, workSlug: string, viewerUid: string) {
  const work = await targetWork(db, missionSlug, projectSlug, workSlug);
  const creator = work.creator_uid === viewerUid;
  const rows = await db.query<{
    id: string; summary: string; evidence_note: string; participant_uid: string; recognized: string | null; amount: string | null; rule_id: string | null; rule_version: string | number | null;
  }>(
    `SELECT contributions.id, contributions.summary, contributions.evidence_note, contributions.participant_uid,
            contribution_recognitions.contribution_id AS recognized, contribution_anchors.amount, contribution_anchors.rule_id, contribution_anchors.rule_version
       FROM contributions
       LEFT JOIN contribution_recognitions ON contribution_recognitions.contribution_id = contributions.id
       LEFT JOIN contribution_anchors ON contribution_anchors.contribution_id = contributions.id
      WHERE contributions.work_id = $1 AND ($2::boolean OR contributions.participant_uid = $3)
      ORDER BY contributions.submitted_at, contributions.id`,
    [work.id, creator, viewerUid],
  );
  return rows.rows.map((row): ContributionView => ({
    id: row.id,
    summary: row.summary,
    evidenceNote: row.evidence_note,
    recognized: row.recognized !== null,
    amount: row.amount,
    ruleId: row.rule_id,
    ruleVersion: row.rule_version === null ? null : String(row.rule_version),
  }));
}

export async function submitContribution(
  db: MissionDb,
  human: { uid: string; email: string },
  missionSlug: string,
  projectSlug: string,
  workSlug: string,
  draft: { summary: string; evidence: string; idempotencyKey: string },
) {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, human);
    const work = await targetWork(tx, missionSlug, projectSlug, workSlug);
    if (work.creator_uid === human.uid) throw new InterestRequestError(403, "The Mission creator records recognition, not their own Contribution.");
    if (!await confirmedHelper(tx, work.id, human.uid)) throw new InterestRequestError(403, "Only a confirmed helper can record a Contribution.");
    const existing = await tx.query<{ id: string; summary: string }>(
      "SELECT id, summary FROM contributions WHERE work_id = $1 AND participant_uid = $2 AND idempotency_key = $3",
      [work.id, human.uid, draft.idempotencyKey],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].summary !== draft.summary) throw new InterestRequestError(409, "That Contribution key was already used.");
      return { id: existing.rows[0].id, status: "recorded" as const };
    }
    await contributorRef(tx, human.uid);
    const id = randomUUID();
    try {
      await tx.query(
        `INSERT INTO contributions (id, work_id, participant_uid, submitted_by_uid, summary, evidence_note, idempotency_key)
         VALUES ($1,$2,$3,$3,$4,$5,$6)`,
        [id, work.id, human.uid, draft.summary, draft.evidence, draft.idempotencyKey],
      );
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new InterestRequestError(409, "That Contribution was already recorded.");
      throw error;
    }
    return { id, status: "recorded" as const };
  });
}

export async function recognizeContributionRecord(
  db: MissionDb,
  creator: { uid: string; email: string },
  missionSlug: string,
  projectSlug: string,
  workSlug: string,
  contributionId: string,
) {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, creator);
    const work = await targetWork(tx, missionSlug, projectSlug, workSlug);
    if (work.creator_uid !== creator.uid) throw new InterestRequestError(403, "Only the Mission creator can recognize a Contribution.");
    const contribution = await tx.query<{ id: string; participant_uid: string }>(
      "SELECT id, participant_uid FROM contributions WHERE id = $1 AND work_id = $2",
      [contributionId, work.id],
    );
    const row = contribution.rows[0];
    if (!row) throw new InterestRequestError(404, "That Contribution was not found.");
    if (!await confirmedHelper(tx, work.id, row.participant_uid)) throw new InterestRequestError(403, "That Contribution is not from a confirmed helper.");
    const existing = await tx.query<{ contribution_id: string }>("SELECT contribution_id FROM contribution_recognitions WHERE contribution_id = $1", [row.id]);
    if (existing.rows[0]) return { id: row.id, status: "recognized" as const };
    await tx.query(
      `INSERT INTO contribution_recognitions (contribution_id, recognized_by_uid, rule_id, rule_version, bridge_idempotency_key)
       VALUES ($1,$2,$3,$4,$5)`,
      [row.id, creator.uid, firstRecognitionRule.ruleId, firstRecognitionRule.version, `recognize:${row.id}`],
    );
    return { id: row.id, status: "recognized" as const };
  });
}
