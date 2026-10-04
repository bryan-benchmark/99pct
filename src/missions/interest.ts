import { randomUUID } from "node:crypto";
import type { MissionDb, MissionSql } from "./db/client";
import type { InterestDraft, ParticipationState } from "./model";

export class InterestRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "InterestRequestError";
    this.status = status;
  }
}

export type OwnInterest = { note: string; createdAt: string; state: ParticipationState };
export type CreatorInterest = { id: string; email: string; note: string; createdAt: string; state: ParticipationState };

type WorkTarget = { id: string; status: string; creator_uid: string };

const workTargetSql = `
  SELECT work_items.id, work_items.status, missions.creator_uid
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

async function targetWork(db: MissionSql, missionSlug: string, projectSlug: string, workSlug: string) {
  const result = await db.query<WorkTarget>(workTargetSql, [missionSlug, projectSlug, workSlug]);
  const work = result.rows[0];
  if (!work || work.status !== "open") throw new InterestRequestError(404, "That work was not found.");
  return work;
}

export async function expressInterest(db: MissionDb, human: { uid: string; email: string }, missionSlug: string, projectSlug: string, workSlug: string, draft: InterestDraft) {
  if (draft.shareEmail !== true) throw new InterestRequestError(400, "Share your verified email before sending interest.");
  return db.transaction(async (tx) => {
    await rememberHuman(tx, human);
    const work = await targetWork(tx, missionSlug, projectSlug, workSlug);
    if (work.creator_uid === human.uid) throw new InterestRequestError(403, "The Mission creator cannot express interest in this Work.");
    const existing = await tx.query<{ id: string }>("SELECT id FROM work_interests WHERE work_id = $1 AND human_uid = $2", [work.id, human.uid]);
    if (existing.rows.length > 0) throw new InterestRequestError(409, "Interest was already sent.");
    try {
      await tx.query(
        "INSERT INTO work_interests (id, work_id, human_uid, private_note, email_share_consented) VALUES ($1, $2, $3, $4, TRUE)",
        [randomUUID(), work.id, human.uid, draft.note],
      );
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new InterestRequestError(409, "Interest was already sent.");
      throw error;
    }
    return { status: "interested" as const };
  });
}

export async function getOwnInterest(db: MissionDb, missionSlug: string, projectSlug: string, workSlug: string, uid: string): Promise<OwnInterest | null> {
  const result = await db.query<{ private_note: string; created_at: Date | string; participation: ParticipationState }>(
    `SELECT work_interests.private_note, work_interests.created_at,
            CASE
              WHEN work_confirmations.invitation_id IS NOT NULL THEN 'helping'
              WHEN work_invitations.id IS NOT NULL THEN 'invited'
              ELSE 'interested'
            END AS participation
     FROM work_interests
     JOIN work_items ON work_items.id = work_interests.work_id
     JOIN projects ON projects.id = work_items.project_id
     JOIN missions ON missions.id = projects.mission_id
     LEFT JOIN work_invitations ON work_invitations.interest_id = work_interests.id
     LEFT JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
     WHERE missions.slug = $1 AND projects.slug = $2 AND work_items.slug = $3 AND work_interests.human_uid = $4`,
    [missionSlug, projectSlug, workSlug, uid],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { note: row.private_note, createdAt: new Date(row.created_at).toISOString(), state: row.participation };
}

export async function listCreatorInterests(db: MissionDb, missionSlug: string, projectSlug: string, workSlug: string, uid: string): Promise<CreatorInterest[]> {
  const work = await targetWork(db, missionSlug, projectSlug, workSlug);
  if (work.creator_uid !== uid) throw new InterestRequestError(403, "Only the Mission creator can see interested people.");
  const result = await db.query<{ id: string; verified_email: string; private_note: string; created_at: Date | string; participation: ParticipationState }>(
    `SELECT work_interests.id, human_accounts.verified_email, work_interests.private_note, work_interests.created_at,
            CASE
              WHEN work_confirmations.invitation_id IS NOT NULL THEN 'helping'
              WHEN work_invitations.id IS NOT NULL THEN 'invited'
              ELSE 'interested'
            END AS participation
     FROM work_interests
     JOIN human_accounts ON human_accounts.firebase_uid = work_interests.human_uid
     LEFT JOIN work_invitations ON work_invitations.interest_id = work_interests.id
     LEFT JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
     WHERE work_interests.work_id = $1
     ORDER BY work_interests.created_at ASC, human_accounts.verified_email ASC`,
    [work.id],
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.verified_email,
    note: row.private_note,
    createdAt: new Date(row.created_at).toISOString(),
    state: row.participation,
  }));
}
