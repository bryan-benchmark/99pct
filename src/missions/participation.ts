import { randomUUID } from "node:crypto";
import type { MissionDb, MissionSql } from "./db/client";
import { InterestRequestError } from "./interest";

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

export async function inviteInterest(db: MissionDb, creator: { uid: string; email: string }, missionSlug: string, projectSlug: string, workSlug: string, interestId: string) {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, creator);
    const work = await targetWork(tx, missionSlug, projectSlug, workSlug);
    if (work.creator_uid !== creator.uid) throw new InterestRequestError(403, "Only the Mission creator can invite someone to help.");
    const interest = await tx.query<{ human_uid: string }>(
      "SELECT human_uid FROM work_interests WHERE id = $1 AND work_id = $2",
      [interestId, work.id],
    );
    const row = interest.rows[0];
    if (!row) throw new InterestRequestError(404, "That interest was not found.");
    if (row.human_uid === creator.uid) throw new InterestRequestError(403, "The Mission creator cannot invite themself.");
    const existing = await tx.query<{ id: string }>("SELECT id FROM work_invitations WHERE interest_id = $1", [interestId]);
    if (existing.rows.length > 0) throw new InterestRequestError(409, "An invitation was already sent.");
    try {
      await tx.query(
        "INSERT INTO work_invitations (id, interest_id, invited_by_uid) VALUES ($1, $2, $3)",
        [randomUUID(), interestId, creator.uid],
      );
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new InterestRequestError(409, "An invitation was already sent.");
      throw error;
    }
    return { status: "invited" as const };
  });
}

export async function confirmParticipation(db: MissionDb, human: { uid: string; email: string }, missionSlug: string, projectSlug: string, workSlug: string) {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, human);
    const work = await targetWork(tx, missionSlug, projectSlug, workSlug);
    const invitation = await tx.query<{ id: string; confirmed: string | null }>(
      `SELECT work_invitations.id, work_confirmations.invitation_id AS confirmed
       FROM work_interests
       JOIN work_invitations ON work_invitations.interest_id = work_interests.id
       LEFT JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
       WHERE work_interests.work_id = $1 AND work_interests.human_uid = $2`,
      [work.id, human.uid],
    );
    const row = invitation.rows[0];
    if (!row) throw new InterestRequestError(404, "No invitation was found.");
    if (row.confirmed) throw new InterestRequestError(409, "Help was already confirmed.");
    try {
      await tx.query("INSERT INTO work_confirmations (invitation_id) VALUES ($1)", [row.id]);
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new InterestRequestError(409, "Help was already confirmed.");
      throw error;
    }
    return { status: "helping" as const };
  });
}
