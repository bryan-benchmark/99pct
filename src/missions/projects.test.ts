import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createProjectRequest } from "../app/api/missions/[slug]/projects/route";
import { createWorkRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/route";
import { embeddedMissionDb, type MissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { MissionInputError, missionEmptyStates, projectCopy, projectDraft, workCopy, workDraft } from "./model";
import {
  MissionAuthorizationError,
  MissionNotFoundError,
  createProject,
  createWork,
  getPublicProject,
  getPublicWork,
  listPublicProjects,
  listPublicWork,
} from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const other = { uid: "human-2", email: "member@example.test" };
const missionDraft = {
  name: "River School",
  purpose: "Teach children how the river works.",
  beneficiaries: "Children in the valley",
  startingPlace: "Global",
};
const projectFields = {
  title: "River lab",
  outcome: "Students can test the river water themselves.",
};
const workFields = {
  kind: "task" as const,
  title: "Collect sample bottles",
  description: "Bring clean bottles so the class can take water samples.",
  doneWhen: "Twenty labeled bottles are at the school.",
};

async function database() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  return db;
}

async function mission(db: MissionDb, who = creator, draft = missionDraft) {
  return createFormingMission(db, who, draft);
}

function request(url: string, body: Record<string, unknown>, origin = "http://localhost:3000") {
  const token = "c".repeat(64);
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: `human_csrf=${token}; human_session=verified-session` },
    body: JSON.stringify({ csrfToken: token, ...body }),
  });
}

test("project and work input limits and kinds are refused before a row is written", async () => {
  const db = await database();
  assert.throws(() => projectDraft({ ...projectFields, title: "A" }), MissionInputError);
  assert.throws(() => projectDraft({ ...projectFields, outcome: "x".repeat(501) }), MissionInputError);
  assert.throws(() => workDraft({ ...workFields, kind: "bounty" }), MissionInputError);
  assert.throws(() => workDraft({ ...workFields, description: "short" }), MissionInputError);
  assert.throws(() => workDraft({ ...workFields, doneWhen: "x".repeat(241) }), MissionInputError);
  const projects = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM projects");
  const work = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_items");
  assert.equal(Number(projects.rows[0].n), 0);
  assert.equal(Number(work.rows[0].n), 0);
});

test("the Mission creator can create a Project and Work, and public records omit the creator", async () => {
  const db = await database();
  const started = await mission(db);
  const project = await createProject(db, creator, started.slug, projectFields);
  const task = await createWork(db, creator, started.slug, project.slug, workFields);
  const role = await createWork(db, creator, started.slug, project.slug, { ...workFields, kind: "role", title: "Sample keeper", description: "Look after the bottles between classes.", doneWhen: "Bottles are clean before each class." });
  assert.equal(project.slug, "river-lab");
  assert.equal(project.status, "active");
  const listedProjects = await listPublicProjects(db, started.slug);
  assert.equal(listedProjects[0].openWorkCount, 2);
  assert.equal(task.kind, "task");
  assert.equal(task.status, "open");
  assert.equal(role.kind, "role");
  const listedWork = await listPublicWork(db, started.slug, project.slug);
  const loaded = await getPublicWork(db, started.slug, project.slug, task.slug);
  const serialized = JSON.stringify({ project, task, role, listedProjects, listedWork, loaded });
  assert.equal(serialized.includes(creator.email), false);
  assert.equal(serialized.includes(creator.uid), false);
  const revisions = await db.query<{ project_revision: number; work_revision: number }>(
    "SELECT (SELECT revision FROM project_revisions) AS project_revision, (SELECT min(revision) FROM work_revisions) AS work_revision",
  );
  assert.equal(Number(revisions.rows[0].project_revision), 1);
  assert.equal(Number(revisions.rows[0].work_revision), 1);
});

test("project and work slugs collide only inside their parent", async () => {
  const db = await database();
  const first = await mission(db);
  const second = await mission(db, other, { ...missionDraft, name: "Harbor Clinic", purpose: "Open a clinic by the harbor." });
  const firstProject = await createProject(db, creator, first.slug, projectFields);
  const sameMission = await createProject(db, creator, first.slug, projectFields);
  const otherMission = await createProject(db, other, second.slug, projectFields);
  assert.equal(sameMission.slug, "river-lab-2");
  assert.equal(otherMission.slug, "river-lab");
  const firstWork = await createWork(db, creator, first.slug, firstProject.slug, workFields);
  const sameProject = await createWork(db, creator, first.slug, firstProject.slug, workFields);
  const otherProject = await createWork(db, creator, first.slug, sameMission.slug, workFields);
  assert.equal(firstWork.slug, "collect-sample-bottles");
  assert.equal(sameProject.slug, "collect-sample-bottles-2");
  assert.equal(otherProject.slug, "collect-sample-bottles");
});

test("public projects and work are listed newest first", async () => {
  const db = await database();
  const started = await mission(db);
  const older = await createProject(db, creator, started.slug, projectFields);
  await db.query("UPDATE projects SET created_at = now() - interval '1 day' WHERE slug = $1", [older.slug]);
  const newer = await createProject(db, creator, started.slug, { title: "Field notes", outcome: "Each visit has a written note." });
  const projects = await listPublicProjects(db, started.slug);
  assert.deepEqual(projects.map((item) => item.slug), [newer.slug, older.slug]);
  const olderWork = await createWork(db, creator, started.slug, newer.slug, workFields);
  await db.query("UPDATE work_items SET created_at = now() - interval '1 day' WHERE slug = $1", [olderWork.slug]);
  const newerWork = await createWork(db, creator, started.slug, newer.slug, { ...workFields, title: "Write the note", description: "Record what the class observed.", doneWhen: "The note is posted the same day." });
  const work = await listPublicWork(db, started.slug, newer.slug);
  assert.deepEqual(work.map((item) => item.slug), [newerWork.slug, olderWork.slug]);
});

test("a failed revision insert cannot leave a half-created Project or Work item", async () => {
  const db = await database();
  const started = await mission(db);
  const failingProject: MissionDb = {
    ...db,
    transaction: (work) => db.transaction((tx) => work({
      ...tx,
      query: async (sql, params) => {
        if (sql.includes("INSERT INTO project_revisions")) throw new Error("revision failed");
        return tx.query(sql, params);
      },
    })),
  };
  await assert.rejects(() => createProject(failingProject, creator, started.slug, projectFields), /revision failed/);
  const projects = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM projects");
  assert.equal(Number(projects.rows[0].n), 0);
  const project = await createProject(db, creator, started.slug, projectFields);
  const failingWork: MissionDb = {
    ...db,
    transaction: (work) => db.transaction((tx) => work({
      ...tx,
      query: async (sql, params) => {
        if (sql.includes("INSERT INTO work_revisions")) throw new Error("revision failed");
        return tx.query(sql, params);
      },
    })),
  };
  await assert.rejects(() => createWork(failingWork, creator, started.slug, project.slug, workFields), /revision failed/);
  const work = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_items");
  assert.equal(Number(work.rows[0].n), 0);
});

test("project and work revisions reject updates and deletes", async () => {
  const db = await database();
  const started = await mission(db);
  const project = await createProject(db, creator, started.slug, projectFields);
  await createWork(db, creator, started.slug, project.slug, workFields);
  await assert.rejects(() => db.query("UPDATE project_revisions SET title = 'Renamed'"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM project_revisions"), /append-only/);
  await assert.rejects(() => db.query("UPDATE work_revisions SET title = 'Renamed'"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM work_revisions"), /append-only/);
  const title = await db.query<{ title: string }>("SELECT title FROM project_revisions");
  assert.equal(title.rows[0].title, projectFields.title);
});

test("only the Mission creator can create a Project or Work", async () => {
  const db = await database();
  const started = await mission(db);
  const elsewhere = await mission(db, other, { ...missionDraft, name: "Harbor Clinic", purpose: "Open a clinic by the harbor." });
  const project = await createProject(db, creator, started.slug, projectFields);
  await assert.rejects(() => createProject(db, other, started.slug, projectFields), MissionAuthorizationError);
  await assert.rejects(() => createWork(db, other, started.slug, project.slug, workFields), MissionAuthorizationError);
  await assert.rejects(() => createWork(db, creator, elsewhere.slug, project.slug, workFields), MissionNotFoundError);
  const counts = await db.query<{ projects: number; work: number }>(
    "SELECT (SELECT count(*) FROM projects)::int AS projects, (SELECT count(*) FROM work_items)::int AS work",
  );
  assert.equal(Number(counts.rows[0].projects), 1);
  assert.equal(Number(counts.rows[0].work), 0);
});

test("project and work routes authorize the session and reject bad input before persistence", async () => {
  const db = await database();
  const started = await mission(db);
  const deps = { verifySession: async () => creator, openDb: async () => db };
  let opened = false;
  const invalid = await createProjectRequest(request("http://localhost:3000/api/missions/river-school/projects", { ...projectFields, title: "A" }), started.slug, {
    verifySession: async () => creator,
    openDb: async () => {
      opened = true;
      throw new Error("database opened");
    },
  });
  assert.equal(invalid.status, 400);
  assert.equal(opened, false);
  const signedOut = await createProjectRequest(request("http://localhost:3000/api/missions/river-school/projects", projectFields), started.slug, {
    verifySession: async () => null,
    openDb: async () => db,
  });
  const crossOrigin = await createProjectRequest(
    request("http://localhost:3000/api/missions/river-school/projects", projectFields, "https://attacker.example"),
    started.slug,
    deps,
  );
  assert.equal(signedOut.status, 401);
  assert.equal(crossOrigin.status, 403);
  const created = await createProjectRequest(
    request("http://localhost:3000/api/missions/river-school/projects", { ...projectFields, creatorUid: "attacker", email: creator.email }),
    started.slug,
    deps,
  );
  assert.equal(created.status, 201);
  const body = await created.json() as { url: string };
  assert.equal(body.url, "/missions/river-school/projects/river-lab");
  assert.equal(JSON.stringify(body).includes(creator.email), false);
  assert.equal(JSON.stringify(body).includes(creator.uid), false);
  const owner = await db.query<{ created_by_uid: string }>("SELECT created_by_uid FROM projects");
  assert.equal(owner.rows[0].created_by_uid, creator.uid);
  const denied = await createProjectRequest(request("http://localhost:3000/api/missions/river-school/projects", { title: "Other lab", outcome: "Another outcome is written down." }), started.slug, {
    verifySession: async () => other,
    openDb: async () => db,
  });
  assert.equal(denied.status, 403);
  const hosted = await createWorkRequest(
    request("https://pct99-494723962533.us-central1.run.app/api/missions/river-school/projects/river-lab/work", workFields, "https://pct99--pct-99.us-central1.hosted.app"),
    started.slug,
    "river-lab",
    deps,
  );
  assert.equal(hosted.status, 201);
  const mismatch = await createWorkRequest(
    request("http://localhost:3000/api/missions/other/projects/river-lab/work", workFields),
    "harbor-clinic",
    "river-lab",
    deps,
  );
  assert.equal(mismatch.status, 404);
  const badWork = await createWorkRequest(request("http://localhost:3000/api/missions/river-school/projects/river-lab/work", { ...workFields, kind: "job" }), started.slug, "river-lab", {
    verifySession: async () => creator,
    openDb: async () => {
      opened = true;
      throw new Error("database opened");
    },
  });
  assert.equal(badWork.status, 400);
  assert.equal(opened, false);
});

test("public pages keep the empty state and do not offer a job, contract, or join action", () => {
  assert.equal(missionEmptyStates.projects, "No projects or open work yet.");
  assert.equal(projectCopy.emptyWork, "No open work has been posted yet.");
  assert.match(projectCopy.workBoundary, /not yet a job offer, contract, promise of pay/);
  assert.match(workCopy.postingBoundary, /does not create a contract, compensation, MCUs, or ownership/);
  assert.equal(workCopy.wantToHelp, "I want to help");
  assert.match(workCopy.interestBoundary, /does not create a job, contract, assignment, compensation, MCUs, or ownership/);
  assert.match(workCopy.readBoundary, /not a binding job or contract/);
  assert.equal(workCopy.illHelp, "I’ll help on this Work");
  assert.match(workCopy.confirmBoundary, /does not create employment, contractor status, a legal contract, compensation, MCUs, or ownership/);
  const pages = [
    "src/app/missions/[slug]/page.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/page.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/page.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/InterestForm.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/InviteForm.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/ConfirmHelpForm.tsx",
    "src/app/missions/[slug]/projects/[projectSlug]/work/new/page.tsx",
  ].map((path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")).join("\n");
  assert.match(pages, /missionEmptyStates.projects/);
  assert.match(pages, /projectCopy.workBoundary/);
  assert.match(pages, /workCopy.wantToHelp/);
  assert.match(pages, /workCopy.interestBoundary/);
  assert.match(pages, /workCopy.readBoundary/);
  assert.match(pages, /workCopy.postingBoundary/);
  assert.equal(pages.includes("Apply"), false);
  assert.equal(/Join this/.test(pages), false);
});
