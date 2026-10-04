import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, listCreatorInterests } from "./interest";
import { confirmParticipation, inviteInterest } from "./participation";
import { createProject, createWork, listOpenWork } from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const helper = { uid: "human-2", email: "helper@example.test" };
const note = "I can bring bottles from the lab.";

test("public work discovery returns newest open work and hides private participation", async () => {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  const mission = await createFormingMission(db, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const project = await createProject(db, creator, mission.slug, {
    title: "River lab",
    outcome: "Students can test the river water themselves.",
  });
  const older = await createWork(db, creator, mission.slug, project.slug, {
    kind: "role",
    title: "Sample keeper",
    description: "Look after the bottles between classes.",
    doneWhen: "Bottles are clean before each class.",
  });
  const newer = await createWork(db, creator, mission.slug, project.slug, {
    kind: "task",
    title: "Collect sample bottles",
    description: "Bring clean bottles so the class can take water samples.",
    doneWhen: "Twenty labeled bottles are at the school.",
  });
  await db.query("UPDATE work_items SET created_at = '2020-01-01T00:00:00Z' WHERE slug = $1", [older.slug]);
  await expressInterest(db, helper, mission.slug, project.slug, newer.slug, { note, shareEmail: true });
  const interest = await listCreatorInterests(db, mission.slug, project.slug, newer.slug, creator.uid);
  await inviteInterest(db, creator, mission.slug, project.slug, newer.slug, interest[0].id);
  await confirmParticipation(db, helper, mission.slug, project.slug, newer.slug);
  const invitations = await db.query<{ id: string }>("SELECT id FROM work_invitations");
  const listed = await listOpenWork(db);
  const serialized = JSON.stringify(listed);
  assert.deepEqual(listed.map((item) => item.slug), [newer.slug, older.slug]);
  assert.equal(listed[0]?.missionName, "River School");
  assert.equal(listed[0]?.projectTitle, "River lab");
  assert.equal(listed[0]?.kind, "task");
  assert.equal(listed[1]?.kind, "role");
  assert.equal(listed[0]?.interestCount, 1);
  assert.equal(listed[0]?.helpingCount, 1);
  assert.equal(listed[1]?.interestCount, 0);
  assert.equal(listed[1]?.helpingCount, 0);
  assert.equal(listed.every((item) => item.kind === "task" || item.kind === "role"), true);
  for (const secret of [creator.email, creator.uid, helper.email, helper.uid, note, interest[0].id, invitations.rows[0].id]) {
    assert.equal(serialized.includes(secret), false);
  }
});
