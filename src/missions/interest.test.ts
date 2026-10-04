import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createInterestRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/interest/route";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, getOwnInterest, listCreatorInterests } from "./interest";
import { MissionInputError, interestDraft, workCopy } from "./model";
import { createProject, createWork, getPublicWork } from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const helper = { uid: "human-2", email: "helper@example.test" };
const stranger = { uid: "human-3", email: "stranger@example.test" };
const missionDraft = {
  name: "River School",
  purpose: "Teach children how the river works.",
  beneficiaries: "Children in the valley",
  startingPlace: "Global",
};
const projectFields = { title: "River lab", outcome: "Students can test the river water themselves." };
const workFields = {
  kind: "task" as const,
  title: "Collect sample bottles",
  description: "Bring clean bottles so the class can take water samples.",
  doneWhen: "Twenty labeled bottles are at the school.",
};
const privateNote = "I can bring bottles from the lab.";

async function ready() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  const mission = await createFormingMission(db, creator, missionDraft);
  const project = await createProject(db, creator, mission.slug, projectFields);
  const work = await createWork(db, creator, mission.slug, project.slug, workFields);
  return { db, mission, project, work };
}

function request(body: Record<string, unknown>, origin = "http://localhost:3000") {
  const token = "c".repeat(64);
  return new NextRequest("http://localhost:3000/api/missions/river-school/projects/river-lab/work/collect-sample-bottles/interest", {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: `human_csrf=${token}; human_session=verified-session` },
    body: JSON.stringify({ csrfToken: token, ...body }),
  });
}

test("interest notes are normalized and oversized notes or missing consent are refused before a row is written", async () => {
  const { db } = await ready();
  assert.throws(() => interestDraft({ shareEmail: false, note: privateNote }), MissionInputError);
  assert.throws(() => interestDraft({ note: privateNote }), MissionInputError);
  assert.throws(() => interestDraft({ shareEmail: true, note: "x".repeat(501) }), MissionInputError);
  const draft = interestDraft({ shareEmail: true, note: "  bottles   from the lab  " });
  assert.equal(draft.note, "bottles from the lab");
  const count = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_interests");
  assert.equal(Number(count.rows[0].n), 0);
});

test("a non-creator can send one immutable interest and public data stays aggregate", async () => {
  const { db, mission, project, work } = await ready();
  const sent = await expressInterest(db, helper, mission.slug, project.slug, work.slug, { note: privateNote, shareEmail: true });
  assert.deepEqual(sent, { status: "interested" });
  await assert.rejects(() => expressInterest(db, helper, mission.slug, project.slug, work.slug, { note: "another note", shareEmail: true }), /already/);
  await assert.rejects(() => expressInterest(db, creator, mission.slug, project.slug, work.slug, { note: "", shareEmail: true }), /creator/);
  await assert.rejects(() => expressInterest(db, helper, "harbor-clinic", project.slug, work.slug, { note: privateNote, shareEmail: true }), /not found/);
  await assert.rejects(() => db.query("UPDATE work_interests SET private_note = 'changed'"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM work_interests"), /append-only/);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_interests");
  assert.equal(Number(rows.rows[0].n), 1);
  const pub = await getPublicWork(db, mission.slug, project.slug, work.slug);
  const serialized = JSON.stringify(pub);
  assert.equal(pub?.interestCount, 1);
  assert.equal(pub?.helpingCount, 0);
  assert.equal(serialized.includes(helper.email), false);
  assert.equal(serialized.includes(helper.uid), false);
  assert.equal(serialized.includes(privateNote), false);
  const own = await getOwnInterest(db, mission.slug, project.slug, work.slug, helper.uid);
  const strangerView = await getOwnInterest(db, mission.slug, project.slug, work.slug, stranger.uid);
  assert.equal(own?.note, privateNote);
  assert.equal(own?.state, "interested");
  assert.equal(JSON.stringify(own).includes(helper.email), false);
  assert.equal(strangerView, null);
  const creatorView = await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid);
  assert.equal(creatorView[0]?.email, helper.email);
  assert.equal(creatorView[0]?.note, privateNote);
  assert.equal(creatorView[0]?.state, "interested");
  assert.equal(JSON.stringify(creatorView).includes(helper.uid), false);
  await assert.rejects(() => listCreatorInterests(db, mission.slug, project.slug, work.slug, stranger.uid), /creator/);
  await assert.rejects(() => listCreatorInterests(db, mission.slug, project.slug, work.slug, helper.uid), /creator/);
});

test("the interest route rejects bad sessions and persists one consented interest", async () => {
  const { db, mission, project, work } = await ready();
  const deps = { verifySession: async () => helper, openDb: async () => db };
  let opened = false;
  const missingConsent = await createInterestRequest(request({ note: privateNote, shareEmail: false }), mission.slug, project.slug, work.slug, {
    verifySession: async () => helper,
    openDb: async () => {
      opened = true;
      throw new Error("database opened");
    },
  });
  assert.equal(missingConsent.status, 400);
  assert.equal(opened, false);
  const signedOut = await createInterestRequest(request({ note: privateNote, shareEmail: true }), mission.slug, project.slug, work.slug, {
    verifySession: async () => null,
    openDb: async () => db,
  });
  const crossOrigin = await createInterestRequest(request({ note: privateNote, shareEmail: true }, "https://attacker.example"), mission.slug, project.slug, work.slug, deps);
  assert.equal(signedOut.status, 401);
  assert.equal(crossOrigin.status, 403);
  const created = await createInterestRequest(request({ note: privateNote, shareEmail: true, uid: "attacker", email: helper.email }), mission.slug, project.slug, work.slug, deps);
  assert.equal(created.status, 201);
  const body = await created.json() as { status: string };
  assert.deepEqual(body, { status: "interested" });
  assert.equal(JSON.stringify(body).includes(helper.email), false);
  assert.equal(JSON.stringify(body).includes(privateNote), false);
  const owner = await db.query<{ human_uid: string }>("SELECT human_uid FROM work_interests");
  assert.equal(owner.rows[0].human_uid, helper.uid);
  const duplicate = await createInterestRequest(request({ note: "again", shareEmail: true }), mission.slug, project.slug, work.slug, deps);
  assert.equal(duplicate.status, 409);
  const creatorAttempt = await createInterestRequest(request({ shareEmail: true }), mission.slug, project.slug, work.slug, {
    verifySession: async () => creator,
    openDb: async () => db,
  });
  assert.equal(creatorAttempt.status, 403);
  const mismatch = await createInterestRequest(request({ shareEmail: true, note: privateNote }), "other-mission", project.slug, work.slug, {
    verifySession: async () => stranger,
    openDb: async () => db,
  });
  assert.equal(mismatch.status, 404);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_interests");
  assert.equal(Number(rows.rows[0].n), 1);
});

test("the work page offers help without employment, membership, or another person's private note", () => {
  const page = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/page.tsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/InterestForm.tsx", import.meta.url), "utf8");
  const invite = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/InviteForm.tsx", import.meta.url), "utf8");
  const confirm = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/ConfirmHelpForm.tsx", import.meta.url), "utf8");
  const source = `${page}\n${form}\n${invite}\n${confirm}`;
  for (const word of ["Apply", "Applicant", "Hired", "Candidate", "Employee", "Contractor", "Assigned", "Member"]) {
    assert.equal(source.includes(word), false, word);
  }
  assert.match(source, /workCopy.wantToHelp/);
  assert.match(source, /workCopy.interestSent/);
  assert.match(source, /workCopy.interestedPeople/);
  assert.match(form, /workCopy.consent/);
  assert.equal(form.includes("defaultChecked"), false);
  assert.match(workCopy.interestBoundary, /does not create a job, contract, assignment/);
});
