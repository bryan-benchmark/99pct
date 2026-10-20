import { utilityByName, utilitySlug, utilities } from "@/content/utilities";
import { readinessCanarySlug } from "./canary";
import type { MissionDb } from "./db/client";
import { publicWorkUrl } from "./model";
import { createProject, createWork } from "./projects";
import { firstWeek } from "./starter";

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
  return [
    ...invited.rows.map((row) => ({ href: publicWorkUrl(row.mission_slug, row.project_slug, row.work_slug), text: `You're invited to help on ${row.title}.` })),
    ...waiting.rows.map((row) => ({ href: publicWorkUrl(row.mission_slug, row.project_slug, row.work_slug), text: `Someone wants to help on ${row.title}.` })),
  ].slice(0, 5);
}
