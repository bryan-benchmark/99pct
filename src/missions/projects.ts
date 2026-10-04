import { randomUUID } from "node:crypto";
import type { MissionDb, MissionSql } from "./db/client";
import {
  scopedSlugBase,
  type ProjectDraft,
  type PublicProject,
  type PublicWork,
  type WorkDraft,
} from "./model";

export class MissionAuthorizationError extends Error {
  constructor() {
    super("Only the Mission creator can do that.");
    this.name = "MissionAuthorizationError";
  }
}

export class MissionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionNotFoundError";
  }
}

type ProjectRow = {
  mission_slug: string;
  slug: string;
  status: "active";
  created_at: Date | string;
  title: string;
  outcome: string;
  open_work_count: number | string;
};

type WorkRow = {
  mission_slug: string;
  project_slug: string;
  slug: string;
  kind: "task" | "role";
  status: "open";
  created_at: Date | string;
  title: string;
  description: string;
  done_when: string;
};

const projectSelect = `
  SELECT missions.slug AS mission_slug, projects.slug, projects.status, projects.created_at,
         revisions.title, revisions.outcome,
         (SELECT count(*) FROM work_items WHERE work_items.project_id = projects.id)::int AS open_work_count
  FROM projects
  JOIN missions ON missions.id = projects.mission_id
  JOIN project_revisions revisions ON revisions.project_id = projects.id
  JOIN (
    SELECT project_id, MAX(revision) AS revision FROM project_revisions GROUP BY project_id
  ) latest ON latest.project_id = revisions.project_id AND latest.revision = revisions.revision
`;

const workSelect = `
  SELECT missions.slug AS mission_slug, projects.slug AS project_slug, work_items.slug, work_items.kind,
         work_items.status, work_items.created_at, revisions.title, revisions.description, revisions.done_when
  FROM work_items
  JOIN projects ON projects.id = work_items.project_id
  JOIN missions ON missions.id = projects.mission_id
  JOIN work_revisions revisions ON revisions.work_id = work_items.id
  JOIN (
    SELECT work_id, MAX(revision) AS revision FROM work_revisions GROUP BY work_id
  ) latest ON latest.work_id = revisions.work_id AND latest.revision = revisions.revision
`;

function publishedProject(row: ProjectRow): PublicProject {
  return {
    missionSlug: row.mission_slug,
    slug: row.slug,
    status: "active",
    title: row.title,
    outcome: row.outcome,
    createdAt: new Date(row.created_at).toISOString(),
    openWorkCount: Number(row.open_work_count),
  };
}

function publishedWork(row: WorkRow): PublicWork {
  return {
    missionSlug: row.mission_slug,
    projectSlug: row.project_slug,
    slug: row.slug,
    kind: row.kind,
    status: "open",
    title: row.title,
    description: row.description,
    doneWhen: row.done_when,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function rememberHuman(tx: MissionSql, creator: { uid: string; email: string }) {
  await tx.query(
    `INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)
     ON CONFLICT (firebase_uid) DO UPDATE SET verified_email = EXCLUDED.verified_email`,
    [creator.uid, creator.email],
  );
}

async function reserveChildSlug(tx: MissionSql, table: "projects" | "work_items", parentColumn: "mission_id" | "project_id", parentId: string, base: string) {
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`.slice(0, 60);
    const existing = await tx.query<{ slug: string }>(
      `SELECT slug FROM ${table} WHERE ${parentColumn} = $1 AND slug = $2`,
      [parentId, candidate],
    );
    if (existing.rows.length === 0) return candidate;
  }
  throw new Error("A readable slug could not be reserved.");
}

export async function viewerMayCreate(db: MissionDb, missionSlug: string, uid: string | undefined) {
  if (!uid) return false;
  const result = await db.query<{ creator_uid: string }>("SELECT creator_uid FROM missions WHERE slug = $1", [missionSlug]);
  return result.rows[0]?.creator_uid === uid;
}

export async function createProject(db: MissionDb, creator: { uid: string; email: string }, missionSlug: string, draft: ProjectDraft): Promise<PublicProject> {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, creator);
    const mission = await tx.query<{ id: string; creator_uid: string }>("SELECT id, creator_uid FROM missions WHERE slug = $1", [missionSlug]);
    const row = mission.rows[0];
    if (!row) throw new MissionNotFoundError("That Mission was not found.");
    if (row.creator_uid !== creator.uid) throw new MissionAuthorizationError();
    const slug = await reserveChildSlug(tx, "projects", "mission_id", row.id, scopedSlugBase(draft.title, "project"));
    const id = randomUUID();
    await tx.query(
      "INSERT INTO projects (id, mission_id, slug, created_by_uid, status) VALUES ($1, $2, $3, $4, 'active')",
      [id, row.id, slug, creator.uid],
    );
    await tx.query(
      "INSERT INTO project_revisions (project_id, revision, author_uid, title, outcome) VALUES ($1, 1, $2, $3, $4)",
      [id, creator.uid, draft.title, draft.outcome],
    );
    const saved = await tx.query<ProjectRow>(`${projectSelect} WHERE projects.id = $1`, [id]);
    return publishedProject(saved.rows[0]);
  });
}

export async function listPublicProjects(db: MissionDb, missionSlug: string): Promise<PublicProject[]> {
  const result = await db.query<ProjectRow>(`${projectSelect} WHERE missions.slug = $1 ORDER BY projects.created_at DESC, projects.slug ASC`, [missionSlug]);
  return result.rows.map(publishedProject);
}

export async function getPublicProject(db: MissionDb, missionSlug: string, projectSlug: string): Promise<PublicProject | null> {
  const result = await db.query<ProjectRow>(`${projectSelect} WHERE missions.slug = $1 AND projects.slug = $2`, [missionSlug, projectSlug]);
  return result.rows[0] ? publishedProject(result.rows[0]) : null;
}

export async function createWork(db: MissionDb, creator: { uid: string; email: string }, missionSlug: string, projectSlug: string, draft: WorkDraft): Promise<PublicWork> {
  return db.transaction(async (tx) => {
    await rememberHuman(tx, creator);
    const project = await tx.query<{ id: string; creator_uid: string }>(
      `SELECT projects.id, missions.creator_uid
       FROM projects JOIN missions ON missions.id = projects.mission_id
       WHERE missions.slug = $1 AND projects.slug = $2`,
      [missionSlug, projectSlug],
    );
    const row = project.rows[0];
    if (!row) throw new MissionNotFoundError("That Project was not found.");
    if (row.creator_uid !== creator.uid) throw new MissionAuthorizationError();
    const slug = await reserveChildSlug(tx, "work_items", "project_id", row.id, scopedSlugBase(draft.title, "work"));
    const id = randomUUID();
    await tx.query(
      "INSERT INTO work_items (id, project_id, slug, created_by_uid, kind, status) VALUES ($1, $2, $3, $4, $5, 'open')",
      [id, row.id, slug, creator.uid, draft.kind],
    );
    await tx.query(
      "INSERT INTO work_revisions (work_id, revision, author_uid, title, description, done_when) VALUES ($1, 1, $2, $3, $4, $5)",
      [id, creator.uid, draft.title, draft.description, draft.doneWhen],
    );
    const saved = await tx.query<WorkRow>(`${workSelect} WHERE work_items.id = $1`, [id]);
    return publishedWork(saved.rows[0]);
  });
}

export async function listPublicWork(db: MissionDb, missionSlug: string, projectSlug: string): Promise<PublicWork[]> {
  const result = await db.query<WorkRow>(
    `${workSelect} WHERE missions.slug = $1 AND projects.slug = $2 ORDER BY work_items.created_at DESC, work_items.slug ASC`,
    [missionSlug, projectSlug],
  );
  return result.rows.map(publishedWork);
}

export async function getPublicWork(db: MissionDb, missionSlug: string, projectSlug: string, workSlug: string): Promise<PublicWork | null> {
  const result = await db.query<WorkRow>(
    `${workSelect} WHERE missions.slug = $1 AND projects.slug = $2 AND work_items.slug = $3`,
    [missionSlug, projectSlug, workSlug],
  );
  return result.rows[0] ? publishedWork(result.rows[0]) : null;
}
