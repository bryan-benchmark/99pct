import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { submitContribution } from "./contributions";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, listCreatorInterests } from "./interest";
import { listMcuBoard } from "./mcu";
import { confirmParticipation, inviteInterest } from "./participation";
import { createProject, createWork } from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const maya = { uid: "human-2", email: "maya@example.test" };
const sam = { uid: "human-3", email: "sam@example.test" };

async function ready() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  const mission = await createFormingMission(db, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const project = await createProject(db, creator, mission.slug, { title: "River lab", outcome: "Students can test the river water themselves." });
  return { db, mission, project };
}

async function post(
  db: Awaited<ReturnType<typeof ready>>["db"],
  missionSlug: string,
  projectSlug: string,
  title: string,
  helper: { uid: string; email: string },
  name: string,
  key: string,
) {
  const work = await createWork(db, creator, missionSlug, projectSlug, {
    kind: "task",
    title,
    description: "Bring clean bottles so the class can take water samples.",
    doneWhen: "Twenty labeled bottles are at the school.",
  });
  await expressInterest(db, helper, missionSlug, projectSlug, work.slug, { note: "I can bring bottles.", shareEmail: true });
  const interest = await listCreatorInterests(db, missionSlug, projectSlug, work.slug, creator.uid);
  await inviteInterest(db, creator, missionSlug, projectSlug, work.slug, interest[0].id);
  await confirmParticipation(db, helper, missionSlug, projectSlug, work.slug);
  await submitContribution(db, helper, missionSlug, projectSlug, work.slug, {
    summary: `Posted ${title}.`,
    evidence: "The piece is posted.",
    idempotencyKey: key,
    name,
  });
}

test("the names page is a board without a score", () => {
  const page = readFileSync(new URL("../app/mcus/page.tsx", import.meta.url), "utf8");
  const person = readFileSync(new URL("../app/mcus/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /There is no score/);
  assert.match(page, /listMcuBoard/);
  assert.equal(/rank|points|leaderboard/i.test(page), false);
  assert.equal(/rank|points|leaderboard/i.test(person), false);
});

test("the newest name is first, and a person is their pieces", async () => {
  const { db, mission, project } = await ready();
  await post(db, mission.slug, project.slug, "Collect sample bottles", maya, "Maya Chen", "maya-1");
  await post(db, mission.slug, project.slug, "Label the bottles", sam, "Sam Ortiz", "sam-1");
  await post(db, mission.slug, project.slug, "Write the river page", maya, "Maya Chen", "maya-2");
  const board = await listMcuBoard(db);
  assert.deepEqual(board.map((person) => person.name), ["Maya Chen", "Sam Ortiz"]);
  assert.equal(board[0].pieces.length, 2);
  assert.equal(board[0].pieces[0].piece, "Write the river page");
  assert.equal(board[1].pieces.length, 1);
  assert.equal(JSON.stringify(board).includes("example.test"), false);
  assert.equal("rank" in board[0], false);
});
