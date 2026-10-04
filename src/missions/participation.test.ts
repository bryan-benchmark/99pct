import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createConfirmRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/participation/confirm/route";
import { createInviteRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/interests/[interestId]/invite/route";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, getOwnInterest, listCreatorInterests } from "./interest";
import { MissionInputError, confirmDraft, workCopy } from "./model";
import { confirmParticipation, inviteInterest } from "./participation";
import { createProject, createWork, getPublicWork } from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const helper = { uid: "human-2", email: "helper@example.test" };
const second = { uid: "human-4", email: "second@example.test" };
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
  await expressInterest(db, helper, mission.slug, project.slug, work.slug, { note: privateNote, shareEmail: true });
  const interest = await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid);
  return { db, mission, project, work, interestId: interest[0].id };
}

function request(path: string, body: Record<string, unknown>, origin = "http://localhost:3000") {
  const token = "c".repeat(64);
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: `human_csrf=${token}; human_session=verified-session` },
    body: JSON.stringify({ csrfToken: token, ...body }),
  });
}

test("confirmation must be explicit before a row is written", async () => {
  const { db } = await ready();
  assert.throws(() => confirmDraft({}), MissionInputError);
  assert.throws(() => confirmDraft({ confirm: false }), MissionInputError);
  assert.deepEqual(confirmDraft({ confirm: true, uid: "attacker" }), { confirm: true });
  const count = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_confirmations");
  assert.equal(Number(count.rows[0].n), 0);
});

test("participation moves from interested to invited to helping without closing the work", async () => {
  const { db, mission, project, work, interestId } = await ready();
  const otherWork = await createWork(db, creator, mission.slug, project.slug, {
    ...workFields,
    title: "Label the bottles",
    description: "Mark each bottle with the place it was filled.",
    doneWhen: "Every bottle has a place label.",
  });
  assert.equal((await getOwnInterest(db, mission.slug, project.slug, work.slug, helper.uid))?.state, "interested");
  await assert.rejects(() => inviteInterest(db, helper, mission.slug, project.slug, work.slug, interestId), /creator/);
  await assert.rejects(() => inviteInterest(db, creator, mission.slug, project.slug, work.slug, randomUUID()), /not found/);
  await assert.rejects(() => inviteInterest(db, creator, mission.slug, project.slug, otherWork.slug, interestId), /not found/);
  assert.deepEqual(await inviteInterest(db, creator, mission.slug, project.slug, work.slug, interestId), { status: "invited" });
  await assert.rejects(() => inviteInterest(db, creator, mission.slug, project.slug, work.slug, interestId), /already/);
  assert.equal((await getOwnInterest(db, mission.slug, project.slug, work.slug, helper.uid))?.state, "invited");
  await assert.rejects(() => confirmParticipation(db, creator, mission.slug, project.slug, work.slug), /invitation/);
  await assert.rejects(() => confirmParticipation(db, stranger, mission.slug, project.slug, work.slug), /invitation/);
  assert.deepEqual(await confirmParticipation(db, helper, mission.slug, project.slug, work.slug), { status: "helping" });
  await assert.rejects(() => confirmParticipation(db, helper, mission.slug, project.slug, work.slug), /already/);
  await expressInterest(db, second, mission.slug, project.slug, work.slug, { note: "I can carry the crate.", shareEmail: true });
  const invitedSecond = (await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid)).find((row) => row.email === second.email);
  if (!invitedSecond) throw new Error("missing second interest");
  await inviteInterest(db, creator, mission.slug, project.slug, work.slug, invitedSecond.id);
  await confirmParticipation(db, second, mission.slug, project.slug, work.slug);
  const pub = await getPublicWork(db, mission.slug, project.slug, work.slug);
  const invitations = await db.query<{ id: string }>("SELECT id FROM work_invitations");
  const serialized = JSON.stringify(pub);
  assert.equal(pub?.status, "open");
  assert.equal(pub?.interestCount, 2);
  assert.equal(pub?.helpingCount, 2);
  for (const secret of [helper.email, helper.uid, second.email, second.uid, privateNote, ...invitations.rows.map((row) => row.id)]) {
    assert.equal(serialized.includes(secret), false, secret);
  }
  const own = await getOwnInterest(db, mission.slug, project.slug, work.slug, helper.uid);
  const creatorView = await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid);
  assert.equal(own?.state, "helping");
  assert.equal(JSON.stringify(own).includes(second.email), false);
  assert.equal(JSON.stringify(own).includes(invitations.rows[0].id), false);
  assert.equal(creatorView.every((row) => row.state === "helping"), true);
  assert.equal(JSON.stringify(creatorView).includes(helper.uid), false);
  assert.equal(JSON.stringify(creatorView).includes(invitations.rows[0].id), false);
  await assert.rejects(() => listCreatorInterests(db, mission.slug, project.slug, work.slug, helper.uid), /creator/);
  await assert.rejects(() => db.query("UPDATE work_invitations SET invited_by_uid = invited_by_uid"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM work_invitations"), /append-only/);
  await assert.rejects(() => db.query("UPDATE work_confirmations SET created_at = created_at"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM work_confirmations"), /append-only/);
  const counts = await db.query<{ invitations: number; confirmations: number }>(
    "SELECT (SELECT count(*) FROM work_invitations)::int AS invitations, (SELECT count(*) FROM work_confirmations)::int AS confirmations",
  );
  assert.equal(Number(counts.rows[0].invitations), 2);
  assert.equal(Number(counts.rows[0].confirmations), 2);
});

test("invite and confirm routes stay scoped to the session", async () => {
  const { db, mission, project, work, interestId } = await ready();
  const invitePath = `/api/missions/${mission.slug}/projects/${project.slug}/work/${work.slug}/interests/${interestId}/invite`;
  const confirmPath = `/api/missions/${mission.slug}/projects/${project.slug}/work/${work.slug}/participation/confirm`;
  const creatorDeps = { verifySession: async () => creator, openDb: async () => db };
  const helperDeps = { verifySession: async () => helper, openDb: async () => db };
  let opened = false;
  const missingConfirm = await createConfirmRequest(request(confirmPath, { confirm: false }), mission.slug, project.slug, work.slug, {
    verifySession: async () => helper,
    openDb: async () => {
      opened = true;
      throw new Error("database opened");
    },
  });
  assert.equal(missingConfirm.status, 400);
  assert.equal(opened, false);
  const signedOut = await createInviteRequest(request(invitePath, { uid: creator.uid }), mission.slug, project.slug, work.slug, interestId, {
    verifySession: async () => null,
    openDb: async () => db,
  });
  const crossOrigin = await createInviteRequest(request(invitePath, {}, "https://attacker.example"), mission.slug, project.slug, work.slug, interestId, creatorDeps);
  const nonCreator = await createInviteRequest(request(invitePath, { uid: helper.uid }), mission.slug, project.slug, work.slug, interestId, helperDeps);
  const unknown = await createInviteRequest(request(invitePath, {}), mission.slug, project.slug, work.slug, randomUUID(), creatorDeps);
  const malformed = await createInviteRequest(request(invitePath, {}), mission.slug, project.slug, work.slug, "not-an-interest", {
    verifySession: async () => creator,
    openDb: async () => {
      throw new Error("database opened");
    },
  });
  assert.equal(signedOut.status, 401);
  assert.equal(crossOrigin.status, 403);
  assert.equal(nonCreator.status, 403);
  assert.equal(unknown.status, 404);
  assert.equal(malformed.status, 404);
  const otherWork = await createWork(db, creator, mission.slug, project.slug, {
    ...workFields,
    title: "Label the bottles",
    description: "Mark each bottle with the place it was filled.",
    doneWhen: "Every bottle has a place label.",
  });
  const mismatch = await createInviteRequest(request(invitePath, { humanUid: helper.uid }), mission.slug, project.slug, otherWork.slug, interestId, creatorDeps);
  assert.equal(mismatch.status, 404);
  const invited = await createInviteRequest(request(invitePath, { uid: "attacker", email: helper.email }), mission.slug, project.slug, work.slug, interestId, creatorDeps);
  assert.equal(invited.status, 201);
  assert.deepEqual(await invited.json(), { status: "invited" });
  const invitedBy = await db.query<{ invited_by_uid: string }>("SELECT invited_by_uid FROM work_invitations");
  assert.equal(invitedBy.rows[0].invited_by_uid, creator.uid);
  const duplicateInvite = await createInviteRequest(request(invitePath, {}), mission.slug, project.slug, work.slug, interestId, creatorDeps);
  assert.equal(duplicateInvite.status, 409);
  const confirmSignedOut = await createConfirmRequest(request(confirmPath, { confirm: true }), mission.slug, project.slug, work.slug, {
    verifySession: async () => null,
    openDb: async () => db,
  });
  const confirmOrigin = await createConfirmRequest(request(confirmPath, { confirm: true }, "https://attacker.example"), mission.slug, project.slug, work.slug, helperDeps);
  const creatorConfirm = await createConfirmRequest(request(confirmPath, { confirm: true, humanUid: helper.uid }), mission.slug, project.slug, work.slug, creatorDeps);
  const strangerConfirm = await createConfirmRequest(request(confirmPath, { confirm: true }), mission.slug, project.slug, work.slug, {
    verifySession: async () => stranger,
    openDb: async () => db,
  });
  assert.equal(confirmSignedOut.status, 401);
  assert.equal(confirmOrigin.status, 403);
  assert.equal(creatorConfirm.status, 404);
  assert.equal(strangerConfirm.status, 404);
  const confirmed = await createConfirmRequest(request(confirmPath, { confirm: true, uid: "attacker" }), mission.slug, project.slug, work.slug, helperDeps);
  assert.equal(confirmed.status, 201);
  assert.deepEqual(await confirmed.json(), { status: "helping" });
  const duplicateConfirm = await createConfirmRequest(request(confirmPath, { confirm: true }), mission.slug, project.slug, work.slug, helperDeps);
  assert.equal(duplicateConfirm.status, 409);
  const rows = await db.query<{ invitations: number; confirmations: number }>(
    "SELECT (SELECT count(*) FROM work_invitations)::int AS invitations, (SELECT count(*) FROM work_confirmations)::int AS confirmations",
  );
  assert.equal(Number(rows.rows[0].invitations), 1);
  assert.equal(Number(rows.rows[0].confirmations), 1);
});

test("the work page names mutual help without employment or membership language", () => {
  const page = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/page.tsx", import.meta.url), "utf8");
  const confirm = readFileSync(new URL("../app/missions/[slug]/projects/[projectSlug]/work/[workSlug]/ConfirmHelpForm.tsx", import.meta.url), "utf8");
  const source = `${page}\n${confirm}`;
  for (const word of ["Apply", "Applicant", "Hired", "Candidate", "Employee", "Contractor", "Assigned", "Member"]) {
    assert.equal(source.includes(word), false, word);
  }
  assert.match(source, /workCopy.invitedToHelp/);
  assert.match(source, /workCopy.youreHelping/);
  assert.match(source, /workCopy.futureContributions/);
  assert.match(source, /workCopy.helpingOnWork/);
  assert.match(source, /workCopy.invitationSent/);
  assert.match(confirm, /workCopy.confirmBoundary/);
  assert.match(confirm, /workCopy.illHelp/);
  assert.match(workCopy.confirmBoundary, /does not create employment, contractor status, a legal contract/);
  assert.equal(workCopy.futureContributions.includes("MCU"), false);
});
