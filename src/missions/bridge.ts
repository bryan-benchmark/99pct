import { firstRecognitionRule } from "@/economic/first-rule";
import type { MissionDb } from "./db/client";

export type BridgeSubmission = {
  missionId: string;
  idempotencyKey: string;
  payload: {
    contributionRef: string;
    contributorRef: string;
    evidenceRef: string;
    ruleId: string;
    ruleVersion: string;
  };
};

type PendingRecognition = {
  contribution_id: string;
  mission_id: string;
  creator_uid: string;
  recognized_by_uid: string;
  participant_uid: string;
  rule_id: string;
  rule_version: string | number;
  bridge_idempotency_key: string;
  contributor_ref: string;
  confirmed: number | null;
};

export async function bridgePendingRecognitions(
  db: MissionDb,
  submit: (input: BridgeSubmission) => Promise<{ id: string }>,
  allowedMissionId: string,
) {
  if (!allowedMissionId) throw new Error("The recognition bridge has no allowed Mission.");
  const pending = await db.query<PendingRecognition>(
    `SELECT contributions.id AS contribution_id, missions.id AS mission_id, missions.creator_uid,
            contribution_recognitions.recognized_by_uid, contributions.participant_uid,
            contribution_recognitions.rule_id, contribution_recognitions.rule_version,
            contribution_recognitions.bridge_idempotency_key, contributor_refs.contributor_ref,
            (SELECT 1 FROM work_interests
               JOIN work_invitations ON work_invitations.interest_id = work_interests.id
               JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
              WHERE work_interests.work_id = contributions.work_id AND work_interests.human_uid = contributions.participant_uid
              LIMIT 1) AS confirmed
       FROM contribution_recognitions
       JOIN contributions ON contributions.id = contribution_recognitions.contribution_id
       JOIN work_items ON work_items.id = contributions.work_id
       JOIN projects ON projects.id = work_items.project_id
       JOIN missions ON missions.id = projects.mission_id
       JOIN contributor_refs ON contributor_refs.firebase_uid = contributions.participant_uid
       LEFT JOIN contribution_bridge_outcomes ON contribution_bridge_outcomes.contribution_id = contributions.id
      WHERE contribution_bridge_outcomes.contribution_id IS NULL
      ORDER BY contribution_recognitions.recognized_at, contributions.id`,
  );
  let bridged = 0;
  for (const row of pending.rows) {
    if (row.mission_id !== allowedMissionId || row.recognized_by_uid !== row.creator_uid || row.confirmed == null) continue;
    if (row.rule_id !== firstRecognitionRule.ruleId || String(row.rule_version) !== firstRecognitionRule.version) continue;
    const submitted = await submit({
      missionId: row.mission_id,
      idempotencyKey: row.bridge_idempotency_key,
      payload: {
        contributionRef: `contribution:${row.contribution_id}`,
        contributorRef: row.contributor_ref,
        evidenceRef: `evidence:${row.contribution_id}`,
        ruleId: firstRecognitionRule.ruleId,
        ruleVersion: firstRecognitionRule.version,
      },
    });
    await db.query(
      `INSERT INTO contribution_bridge_outcomes (contribution_id, economic_intent_id)
       VALUES ($1, $2)
       ON CONFLICT (contribution_id) DO NOTHING`,
      [row.contribution_id, submitted.id],
    );
    bridged += 1;
  }
  return bridged;
}

export async function recordAnchoredGrants(
  db: MissionDb,
  grants: Array<{ contributionId: string; amount: string; ruleId: string; ruleVersion: string; eventId: string; checkpointSequence: string }>,
) {
  let recorded = 0;
  for (const grant of grants) {
    if (grant.amount !== firstRecognitionRule.amount || grant.ruleId !== firstRecognitionRule.ruleId || grant.ruleVersion !== firstRecognitionRule.version) continue;
    const inserted = await db.query<{ contribution_id: string }>(
      `INSERT INTO contribution_anchors (contribution_id, amount, rule_id, rule_version, event_id, checkpoint_sequence)
       SELECT contributions.id, $2, $3, $4, $5, $6
         FROM contributions
         JOIN contribution_recognitions ON contribution_recognitions.contribution_id = contributions.id
         JOIN contribution_bridge_outcomes ON contribution_bridge_outcomes.contribution_id = contributions.id
        WHERE contributions.id = $1
       ON CONFLICT (contribution_id) DO NOTHING
       RETURNING contribution_id`,
      [grant.contributionId, grant.amount, grant.ruleId, grant.ruleVersion, grant.eventId, grant.checkpointSequence],
    );
    recorded += inserted.rows.length;
  }
  return recorded;
}
