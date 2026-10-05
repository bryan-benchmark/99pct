import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createRecognitionRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/contributions/[contributionId]/recognize/route";
import { createContributionRequest } from "../app/api/missions/[slug]/projects/[projectSlug]/work/[workSlug]/contributions/route";
import { bridgePendingRecognitions, recordAnchoredGrants } from "./bridge";
import { contributionContentHash, recognizeContributionRecord, submitContribution } from "./contributions";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, listCreatorInterests } from "./interest";
import { MissionInputError, contributionDraft, recognitionDraft } from "./model";
import { confirmParticipation, inviteInterest } from "./participation";
import { createProject, createWork } from "./projects";
import { createFormingMission } from "./store";
import { firstRecognitionRule } from "@/economic/first-rule";

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

async function ready() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  const mission = await createFormingMission(db, creator, missionDraft);
  const project = await createProject(db, creator, mission.slug, projectFields);
  const work = await createWork(db, creator, mission.slug, project.slug, workFields);
  await expressInterest(db, helper, mission.slug, project.slug, work.slug, { note: "I can bring bottles.", shareEmail: true });
  const interest = await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid);
  await inviteInterest(db, creator, mission.slug, project.slug, work.slug, interest[0].id);
  await confirmParticipation(db, helper, mission.slug, project.slug, work.slug);
  const missionId = await db.query<{ id: string }>("SELECT id FROM missions WHERE slug = $1", [mission.slug]);
  return { db, mission, project, work, missionId: missionId.rows[0].id };
}

test("a Contribution cannot choose an MCU amount", () => {
  assert.throws(() => contributionDraft({ summary: "Bottles", idempotencyKey: "one", amount: "1" }), MissionInputError);
  assert.throws(() => recognitionDraft({ recognize: true, ruleId: "fixed-recognition" }), MissionInputError);
});

test("only a confirmed helper can record a Contribution, and recognition is creator-only", async () => {
  const { db, mission, project, work, missionId } = await ready();
  const draft = { summary: "Brought twenty bottles.", evidence: "Bottles are in the lab.", idempotencyKey: "bottles-1" };
  await assert.rejects(() => submitContribution(db, stranger, mission.slug, project.slug, work.slug, draft), /confirmed helper/);
  await assert.rejects(() => submitContribution(db, creator, mission.slug, project.slug, work.slug, draft), /creator/);
  const recorded = await submitContribution(db, helper, mission.slug, project.slug, work.slug, draft);
  const replay = await submitContribution(db, helper, mission.slug, project.slug, work.slug, draft);
  assert.equal(replay.id, recorded.id);
  await assert.rejects(() => submitContribution(db, helper, mission.slug, project.slug, work.slug, { ...draft, summary: "Different" }), /already used/);
  await assert.rejects(() => submitContribution(db, helper, mission.slug, project.slug, work.slug, { ...draft, evidence: "A different bottle count." }), /already used/);
  await assert.rejects(() => recognizeContributionRecord(db, helper, mission.slug, project.slug, work.slug, recorded.id), /creator/);
  const recognized = await recognizeContributionRecord(db, creator, mission.slug, project.slug, work.slug, recorded.id);
  assert.equal(recognized.status, "recognized");
  await recognizeContributionRecord(db, creator, mission.slug, project.slug, work.slug, recorded.id);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM contribution_recognitions");
  assert.equal(Number(rows.rows[0].n), 1);
  const submitted: string[] = [];
  const bridged = await bridgePendingRecognitions(db, async (input) => {
    submitted.push(input.payload.contributionRef);
    assert.equal(input.missionId, missionId);
    assert.equal(input.payload.ruleId, firstRecognitionRule.ruleId);
    assert.equal(input.payload.ruleVersion, firstRecognitionRule.version);
    assert.match(input.payload.contributorRef, /^contributor:[a-z0-9]+$/);
    return { id: randomUUID() };
  }, missionId);
  assert.equal(bridged, 1);
  assert.equal(submitted.length, 1);
  assert.equal(await bridgePendingRecognitions(db, async () => ({ id: randomUUID() }), missionId), 0);
  const anchored = await recordAnchoredGrants(db, [{
    contributionId: recorded.id,
    amount: firstRecognitionRule.amount,
    ruleId: firstRecognitionRule.ruleId,
    ruleVersion: firstRecognitionRule.version,
    eventId: randomUUID(),
    checkpointSequence: "4",
  }]);
  assert.equal(anchored, 1);
  assert.equal(await recordAnchoredGrants(db, [{
    contributionId: recorded.id,
    amount: firstRecognitionRule.amount,
    ruleId: firstRecognitionRule.ruleId,
    ruleVersion: firstRecognitionRule.version,
    eventId: randomUUID(),
    checkpointSequence: "4",
  }]), 0);
});

test("the Contribution route rejects a client amount and a signed-out session", async () => {
  const { db, mission, project, work } = await ready();
  const token = "c".repeat(64);
  const request = new NextRequest(`http://localhost:3000/api/missions/${mission.slug}/projects/${project.slug}/work/${work.slug}/contributions`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", cookie: `human_csrf=${token}; human_session=verified` },
    body: JSON.stringify({ csrfToken: token, summary: "Bottles", idempotencyKey: "one", amount: "1000000", uid: stranger.uid }),
  });
  const rejected = await createContributionRequest(request, mission.slug, project.slug, work.slug, {
    verifySession: async () => helper,
    openDb: async () => db,
  });
  assert.equal(rejected.status, 400);
  const signedOut = await createContributionRequest(new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ csrfToken: token, summary: "Brought bottles.", idempotencyKey: "signed-out" }),
  }), mission.slug, project.slug, work.slug, {
    verifySession: async () => null,
    openDb: async () => db,
  });
  assert.equal(signedOut.status, 401);
  const asSomeoneElse = await createContributionRequest(new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ csrfToken: token, summary: "Brought bottles.", idempotencyKey: "as-someone", uid: stranger.uid }),
  }), mission.slug, project.slug, work.slug, {
    verifySession: async () => helper,
    openDb: async () => db,
  });
  assert.equal(asSomeoneElse.status, 400);
  const recorded = await createContributionRequest(new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ csrfToken: token, summary: "Brought bottles.", evidence: "", idempotencyKey: "two" }),
  }), mission.slug, project.slug, work.slug, {
    verifySession: async () => helper,
    openDb: async () => db,
  });
  assert.equal(recorded.status, 201);
  const owner = await db.query<{ participant_uid: string }>("SELECT participant_uid FROM contributions");
  assert.equal(owner.rows[0].participant_uid, helper.uid);
  const count = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM contributions");
  assert.equal(Number(count.rows[0].n), 1);
});

test("a creator cannot recognize a Contribution on another Mission, and the bridge skips unconfirmed rows", async () => {
  const { db, mission, project, work } = await ready();
  const otherCreator = { uid: "human-9", email: "other@example.test" };
  const other = await createFormingMission(db, otherCreator, { ...missionDraft, name: "Hill School" });
  const recorded = await submitContribution(db, helper, mission.slug, project.slug, work.slug, {
    summary: "Brought twenty bottles.", evidence: "", idempotencyKey: "bottles-2",
  });
  const token = "c".repeat(64);
  const response = await createRecognitionRequest(new NextRequest("http://localhost:3000/recognize", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", cookie: `human_csrf=${token}` },
    body: JSON.stringify({ csrfToken: token, recognize: true }),
  }), other.slug, project.slug, work.slug, recorded.id, {
    verifySession: async () => otherCreator,
    openDb: async () => db,
  });
  assert.equal(response.status, 404);
  await db.query("INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)", [stranger.uid, stranger.email]);
  const workRow = await db.query<{ id: string }>("SELECT id FROM work_items WHERE slug = $1", [work.slug]);
  const unconfirmedId = randomUUID();
  await db.query(
    `INSERT INTO contributions (id, work_id, participant_uid, submitted_by_uid, summary, idempotency_key, content_hash)
     VALUES ($1,$2,$3,$3,'Unconfirmed help','unconfirmed-1',$4)`,
    [unconfirmedId, workRow.rows[0].id, stranger.uid, contributionContentHash("Unconfirmed help", "")],
  );
  await db.query(
    `INSERT INTO contribution_recognitions (contribution_id, recognized_by_uid, rule_id, rule_version, bridge_idempotency_key)
     VALUES ($1,$2,'fixed-recognition',1,'recognize:unconfirmed')`,
    [unconfirmedId, creator.uid],
  );
  assert.equal(await bridgePendingRecognitions(db, async () => ({ id: randomUUID() }), (await db.query<{ id: string }>("SELECT id FROM missions WHERE slug = $1", [mission.slug])).rows[0].id), 0);
});

test("two bridge attempts record one outcome", async () => {
  const { db, mission, project, work, missionId } = await ready();
  const recorded = await submitContribution(db, helper, mission.slug, project.slug, work.slug, {
    summary: "Brought twenty bottles.", evidence: "", idempotencyKey: "bottles-3",
  });
  await recognizeContributionRecord(db, creator, mission.slug, project.slug, work.slug, recorded.id);
  const intentId = randomUUID();
  await Promise.all([
    bridgePendingRecognitions(db, async () => ({ id: intentId }), missionId),
    bridgePendingRecognitions(db, async () => ({ id: intentId }), missionId),
  ]);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM contribution_bridge_outcomes");
  assert.equal(Number(rows.rows[0].n), 1);
});
