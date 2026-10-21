import { randomUUID } from "node:crypto";
import { utilityBeneficiaries, utilityByName, utilityBySlug, utilityPurpose, utilitySlug, utilities } from "@/content/utilities";
import { readinessCanarySlug } from "./canary";
import type { MissionDb, MissionSql } from "./db/client";
import { publicMissionUrl, publicWorkUrl } from "./model";
import { createProject, createWork } from "./projects";
import { firstWeek } from "./starter";
import { createFormingMission } from "./store";

export type Pulse = { missions: number; openWork: number; helpers: number; featuredHelpers: number };

const featuredSlug = utilitySlug("Rideshare 99");

export function lifeSentence(pulse: Pulse) {
  const parts: string[] = [];
  if (pulse.featuredHelpers === 1) parts.push("1 person can help with Rideshare 99.");
  else if (pulse.featuredHelpers > 1) parts.push(`${pulse.featuredHelpers} people can help with Rideshare 99.`);
  const others = pulse.helpers - pulse.featuredHelpers;
  if (others === 1) parts.push("1 person can help with another utility.");
  else if (others > 1) parts.push(`${others} people can help with other utilities.`);
  if (pulse.openWork === 1) parts.push("1 piece of work is open.");
  else if (pulse.openWork > 1) parts.push(`${pulse.openWork} pieces of work are open.`);
  if (pulse.missions === 1) parts.push("1 utility has been started.");
  else if (pulse.missions > 1) parts.push(`${pulse.missions} utilities have been started.`);
  return parts.join(" ");
}

export async function seedFirstWeek(db: MissionDb, creator: { uid: string; email: string }, missionSlug: string, name: string) {
  const utility = utilityByName(name);
  if (!utility) return;
  const kit = firstWeek(utility);
  const project = await createProject(db, creator, missionSlug, kit.project);
  for (const item of kit.work) await createWork(db, creator, missionSlug, project.slug, item);
}

type PieceOffer = { uid: string; email: string; piece: string; note: string };

async function rememberHuman(tx: MissionSql, human: { uid: string; email: string }) {
  await tx.query(
    `INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)
     ON CONFLICT (firebase_uid) DO UPDATE SET verified_email = EXCLUDED.verified_email`,
    [human.uid, human.email],
  );
}

async function openPiece(db: MissionSql, missionSlug: string, title: string) {
  const result = await db.query<{ id: string; project_slug: string; work_slug: string }>(
    `SELECT work_items.id, projects.slug AS project_slug, work_items.slug AS work_slug
     FROM work_items
     JOIN projects ON projects.id = work_items.project_id
     JOIN missions ON missions.id = projects.mission_id
     JOIN work_revisions revisions ON revisions.work_id = work_items.id
     JOIN (SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id) latest
       ON latest.work_id = revisions.work_id AND latest.revision = revisions.revision
     WHERE missions.slug = $1 AND revisions.title = $2 AND work_items.status = 'open'
     LIMIT 1`,
    [missionSlug, title],
  );
  return result.rows[0] ?? null;
}

async function seatOffer(db: MissionDb, invitedByUid: string, missionSlug: string, offer: PieceOffer): Promise<string | null> {
  if (offer.uid === invitedByUid || offer.piece === "") return null;
  return db.transaction(async (tx) => {
    const work = await openPiece(tx, missionSlug, offer.piece);
    if (!work) return null;
    await rememberHuman(tx, offer);
    const existing = await tx.query<{ id: string }>(
      "SELECT id FROM work_interests WHERE work_id = $1 AND human_uid = $2",
      [work.id, offer.uid],
    );
    let interestId = existing.rows[0]?.id;
    if (!interestId) {
      interestId = randomUUID();
      try {
        await tx.query(
          "INSERT INTO work_interests (id, work_id, human_uid, private_note, email_share_consented) VALUES ($1, $2, $3, $4, TRUE)",
          [interestId, work.id, offer.uid, offer.note],
        );
      } catch (error) {
        if (!(error instanceof Error) || !/unique|duplicate/i.test(error.message)) throw error;
        const again = await tx.query<{ id: string }>("SELECT id FROM work_interests WHERE work_id = $1 AND human_uid = $2", [work.id, offer.uid]);
        interestId = again.rows[0]?.id;
        if (!interestId) throw error;
      }
    }
    const invited = await tx.query<{ id: string }>("SELECT id FROM work_invitations WHERE interest_id = $1", [interestId]);
    if (!invited.rows[0]) {
      try {
        await tx.query(
          "INSERT INTO work_invitations (id, interest_id, invited_by_uid) VALUES ($1, $2, $3)",
          [randomUUID(), interestId, invitedByUid],
        );
      } catch (error) {
        if (!(error instanceof Error) || !/unique|duplicate/i.test(error.message)) throw error;
      }
    }
    return publicWorkUrl(missionSlug, work.project_slug, work.work_slug);
  });
}

export async function seatWaitingOffers(db: MissionDb, creator: { uid: string; email: string }, missionSlug: string, name: string) {
  const utility = utilityByName(name);
  if (!utility) return;
  const offers = await db.query<{ human_uid: string; email: string; piece: string; note: string }>(
    `SELECT utility_offers.human_uid, human_accounts.verified_email AS email, utility_offers.piece, utility_offers.note
     FROM utility_offers
     JOIN human_accounts ON human_accounts.firebase_uid = utility_offers.human_uid
     WHERE utility_offers.utility_slug = $1 AND utility_offers.human_uid <> $2
     ORDER BY utility_offers.created_at ASC, utility_offers.id ASC`,
    [utilitySlug(utility.name), creator.uid],
  );
  for (const offer of offers.rows) {
    await seatOffer(db, creator.uid, missionSlug, { uid: offer.human_uid, email: offer.email, piece: offer.piece, note: offer.note });
  }
}

const stewardPiece = "Look after the list";

export async function openUtilityFromList(db: MissionDb, human: { uid: string; email: string }, draft: { slug: string; piece: string }): Promise<string | null> {
  if (draft.piece !== stewardPiece) return null;
  const utility = utilities.find((item) => utilitySlug(item.name) === draft.slug);
  if (!utility || await findStartedUtility(db, utility.name)) return null;
  const mission = await createFormingMission(db, human, {
    name: utility.name,
    purpose: utilityPurpose(utility),
    beneficiaries: utilityBeneficiaries,
    startingPlace: "Not named yet",
  });
  await seedFirstWeek(db, human, mission.slug, utility.name);
  const first = await findStartedUtility(db, utility.name);
  if (first?.slug === mission.slug) await seatWaitingOffers(db, human, mission.slug, utility.name);
  return publicMissionUrl(first?.slug === mission.slug ? mission.slug : (first?.slug ?? mission.slug));
}

export async function seatOfferOnStartedUtility(db: MissionDb, human: { uid: string; email: string }, draft: { slug: string; piece: string; note: string }): Promise<string | null> {
  const utility = utilities.find((item) => utilitySlug(item.name) === draft.slug);
  if (!utility) return null;
  const started = await findStartedUtility(db, utility.name);
  if (!started) return null;
  const creator = await db.query<{ creator_uid: string }>("SELECT creator_uid FROM missions WHERE slug = $1", [started.slug]);
  const invitedBy = creator.rows[0]?.creator_uid;
  if (!invitedBy) return null;
  return seatOffer(db, invitedBy, started.slug, { uid: human.uid, email: human.email, piece: draft.piece, note: draft.note });
}

export async function publicPulse(db: MissionDb): Promise<Pulse> {
  const names = utilities.map((utility) => utility.name);
  const result = await db.query<{ missions: number; open_work: number; helpers: number; featured_helpers: number }>(
    `SELECT
       (SELECT count(*)::int FROM missions
          JOIN mission_revisions revisions ON revisions.mission_id = missions.id
          JOIN (SELECT mission_id, MAX(revision) AS revision FROM mission_revisions GROUP BY mission_id) latest
            ON latest.mission_id = revisions.mission_id AND latest.revision = revisions.revision
         WHERE revisions.name = ANY($1::text[])) AS missions,
       (SELECT count(*)::int FROM work_items
          JOIN projects ON projects.id = work_items.project_id
          JOIN missions ON missions.id = projects.mission_id
         WHERE work_items.status = 'open' AND missions.slug <> $3) AS open_work,
       (SELECT count(*)::int FROM utility_offers) AS helpers,
       (SELECT count(*)::int FROM utility_offers WHERE utility_slug = $2) AS featured_helpers`,
    [names, featuredSlug, readinessCanarySlug],
  );
  const row = result.rows[0];
  return {
    missions: Number(row?.missions ?? 0),
    openWork: Number(row?.open_work ?? 0),
    helpers: Number(row?.helpers ?? 0),
    featuredHelpers: Number(row?.featured_helpers ?? 0),
  };
}

export async function findStartedUtility(db: MissionDb, name: string): Promise<{ slug: string } | null> {
  const result = await db.query<{ slug: string }>(
    `SELECT missions.slug FROM missions
     JOIN mission_revisions revisions ON revisions.mission_id = missions.id
     JOIN (SELECT mission_id, MAX(revision) AS revision FROM mission_revisions GROUP BY mission_id) latest
       ON latest.mission_id = revisions.mission_id AND latest.revision = revisions.revision
     WHERE revisions.name = $1
     ORDER BY missions.created_at ASC, missions.slug ASC
     LIMIT 1`,
    [name],
  );
  return result.rows[0] ?? null;
}

export type GrowthNotice = { href: string; text: string };

export async function listGrowthNotices(db: MissionDb, uid: string): Promise<GrowthNotice[]> {
  const invited = await db.query<{ mission_slug: string; project_slug: string; work_slug: string; title: string }>(
    `SELECT missions.slug AS mission_slug, projects.slug AS project_slug, work_items.slug AS work_slug, revisions.title
     FROM work_invitations
     JOIN work_interests ON work_interests.id = work_invitations.interest_id
     JOIN work_items ON work_items.id = work_interests.work_id
     JOIN projects ON projects.id = work_items.project_id
     JOIN missions ON missions.id = projects.mission_id
     JOIN work_revisions revisions ON revisions.work_id = work_items.id
     JOIN (SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id) latest
       ON latest.work_id = revisions.work_id AND latest.revision = revisions.revision
     LEFT JOIN work_confirmations ON work_confirmations.invitation_id = work_invitations.id
     WHERE work_interests.human_uid = $1 AND work_confirmations.invitation_id IS NULL
     ORDER BY work_invitations.created_at ASC
     LIMIT 5`,
    [uid],
  );
  const waiting = await db.query<{ mission_slug: string; project_slug: string; work_slug: string; title: string }>(
    `SELECT missions.slug AS mission_slug, projects.slug AS project_slug, work_items.slug AS work_slug, revisions.title
     FROM work_interests
     JOIN work_items ON work_items.id = work_interests.work_id
     JOIN projects ON projects.id = work_items.project_id
     JOIN missions ON missions.id = projects.mission_id
     JOIN work_revisions revisions ON revisions.work_id = work_items.id
     JOIN (SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id) latest
       ON latest.work_id = revisions.work_id AND latest.revision = revisions.revision
     LEFT JOIN work_invitations ON work_invitations.interest_id = work_interests.id
     WHERE missions.creator_uid = $1 AND work_invitations.id IS NULL
     ORDER BY work_interests.created_at ASC
     LIMIT 5`,
    [uid],
  );
  const posted = await db.query<{ mission_slug: string; project_slug: string; work_slug: string; title: string }>(
    `SELECT missions.slug AS mission_slug, projects.slug AS project_slug, work_items.slug AS work_slug, revisions.title
     FROM work_confirmations
     JOIN work_invitations ON work_invitations.id = work_confirmations.invitation_id
     JOIN work_interests ON work_interests.id = work_invitations.interest_id
     JOIN work_items ON work_items.id = work_interests.work_id
     JOIN projects ON projects.id = work_items.project_id
     JOIN missions ON missions.id = projects.mission_id
     JOIN work_revisions revisions ON revisions.work_id = work_items.id
     JOIN (SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id) latest
       ON latest.work_id = revisions.work_id AND latest.revision = revisions.revision
     WHERE work_interests.human_uid = $1 AND missions.slug <> $2
       AND NOT EXISTS (
         SELECT 1 FROM contributions
         WHERE contributions.work_id = work_items.id AND contributions.participant_uid = work_interests.human_uid
       )
     ORDER BY work_confirmations.created_at ASC
     LIMIT 5`,
    [uid, readinessCanarySlug],
  );
  const offers = await db.query<{ utility_slug: string; piece: string }>(
    "SELECT utility_slug, piece FROM utility_offers WHERE human_uid = $1 AND piece <> '' ORDER BY created_at ASC LIMIT 5",
    [uid],
  );
  const waitingOn: GrowthNotice[] = [];
  for (const offer of offers.rows) {
    const utility = utilityBySlug(offer.utility_slug);
    if (!utility || await findStartedUtility(db, utility.name)) continue;
    const starts = firstWeek(utility).work.some((item) => item.title === "Look after the list") && offer.piece !== "Look after the list";
    waitingOn.push({
      href: `/use/${offer.utility_slug}?piece=${encodeURIComponent(offer.piece)}#help`,
      text: starts ? `You're on ${offer.piece}. It starts when someone takes Look after the list.` : `You're on ${offer.piece}.`,
    });
  }
  return [
    ...posted.rows.map((row) => ({ href: publicWorkUrl(row.mission_slug, row.project_slug, row.work_slug), text: `Post what you did on ${row.title}.` })),
    ...invited.rows.filter((row) => row.mission_slug !== readinessCanarySlug).map((row) => ({ href: publicWorkUrl(row.mission_slug, row.project_slug, row.work_slug), text: `You're invited to help on ${row.title}.` })),
    ...waitingOn,
    ...waiting.rows.filter((row) => row.mission_slug !== readinessCanarySlug).map((row) => ({ href: publicWorkUrl(row.mission_slug, row.project_slug, row.work_slug), text: `Someone wants to help on ${row.title}.` })),
  ].slice(0, 5);
}
