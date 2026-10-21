import { readinessCanarySlug } from "./canary";
import type { MissionDb } from "./db/client";

export type PublicMcu = {
  id: string;
  name: string;
  slug: string;
  piece: string;
  summary: string;
  utility: string;
  missionSlug: string;
  projectSlug: string;
  workSlug: string;
};

const mcuSelect = `
  SELECT contributions.id, contributions.public_name AS name, contributions.public_slug AS slug,
         revisions.title AS piece, contributions.summary,
         mission_revisions.name AS utility, missions.slug AS mission_slug,
         projects.slug AS project_slug, work_items.slug AS work_slug
  FROM contributions
  JOIN work_items ON work_items.id = contributions.work_id
  JOIN projects ON projects.id = work_items.project_id
  JOIN missions ON missions.id = projects.mission_id
  JOIN work_revisions revisions ON revisions.work_id = work_items.id
  JOIN (SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id) latest_work
    ON latest_work.work_id = revisions.work_id AND latest_work.revision = revisions.revision
  JOIN mission_revisions ON mission_revisions.mission_id = missions.id
  JOIN (SELECT mission_id, MAX(revision) AS revision FROM mission_revisions GROUP BY mission_id) latest_mission
    ON latest_mission.mission_id = mission_revisions.mission_id AND latest_mission.revision = mission_revisions.revision
  WHERE contributions.public_name <> '' AND contributions.public_slug <> '' AND missions.slug <> $1
`;

function published(row: {
  id: string; name: string; slug: string; piece: string; summary: string; utility: string;
  mission_slug: string; project_slug: string; work_slug: string;
}): PublicMcu {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    piece: row.piece,
    summary: row.summary,
    utility: row.utility,
    missionSlug: row.mission_slug,
    projectSlug: row.project_slug,
    workSlug: row.work_slug,
  };
}

export type McuPerson = {
  name: string;
  slug: string;
  pieces: PublicMcu[];
};

export async function listMcuBoard(db: MissionDb, limit = 40): Promise<McuPerson[]> {
  const recent = await listRecentMcus(db, 200);
  const order: string[] = [];
  const bySlug = new Map<string, PublicMcu[]>();
  for (const item of recent) {
    const pieces = bySlug.get(item.slug);
    if (pieces) pieces.push(item);
    else {
      bySlug.set(item.slug, [item]);
      order.push(item.slug);
    }
  }
  return order.slice(0, limit).map((slug) => {
    const pieces = bySlug.get(slug) ?? [];
    return { name: pieces[0]?.name ?? "", slug, pieces };
  });
}

export async function listRecentMcus(db: MissionDb, limit = 8): Promise<PublicMcu[]> {
  const result = await db.query<Parameters<typeof published>[0]>(
    `${mcuSelect} ORDER BY contributions.submitted_at DESC, contributions.id DESC LIMIT $2`,
    [readinessCanarySlug, limit],
  );
  return result.rows.map(published);
}

export async function listWorkMcus(db: MissionDb, missionSlug: string, projectSlug: string, workSlug: string): Promise<PublicMcu[]> {
  const result = await db.query<Parameters<typeof published>[0]>(
    `${mcuSelect} AND missions.slug = $2 AND projects.slug = $3 AND work_items.slug = $4
     ORDER BY contributions.submitted_at ASC, contributions.id ASC`,
    [readinessCanarySlug, missionSlug, projectSlug, workSlug],
  );
  return result.rows.map(published);
}

export async function listMcusBySlug(db: MissionDb, slug: string): Promise<PublicMcu[]> {
  const result = await db.query<Parameters<typeof published>[0]>(
    `${mcuSelect} AND contributions.public_slug = $2
     ORDER BY contributions.submitted_at DESC, contributions.id DESC`,
    [readinessCanarySlug, slug],
  );
  return result.rows.map(published);
}
