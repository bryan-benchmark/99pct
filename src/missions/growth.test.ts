import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createMissionRequest } from "../app/api/missions/route";
import { createOfferRequest } from "../app/api/utilities/[slug]/offer/route";
import { utilities, utilitySlug } from "@/content/utilities";
import { readinessCanarySlug } from "./canary";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { findStartedUtility, lifeSentence, listGrowthNotices, publicPulse } from "./growth";
import { expressInterest, listCreatorInterests } from "./interest";
import { confirmParticipation, inviteInterest } from "./participation";
import { listCreatorOffers, listPieceCounts, listPublicOfferCounts, offerDraft } from "./offers";
import { createProject, createWork, listOpenWork } from "./projects";
import { firstWeek } from "./starter";
import { createFormingMission, getPublicMission, listPublicMissions } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const helper = { uid: "human-2", email: "helper@example.test" };
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function database() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  return db;
}

function request(path: string, body: Record<string, unknown>, options?: { origin?: string; signedIn?: boolean }) {
  const token = "c".repeat(64);
  const signedIn = options?.signedIn !== false;
  const cookie = signedIn ? `human_csrf=${token}; human_session=verified-session` : `human_csrf=${token}`;
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: options?.origin ?? "http://localhost:3000", cookie },
    body: JSON.stringify({ csrfToken: token, ...body }),
  });
}

test("every utility has one slug and a first week that fits the work limits", () => {
  const slugs = utilities.map((utility) => utilitySlug(utility.name));
  assert.equal(new Set(slugs).size, slugs.length);
  for (const utility of utilities) {
    const slug = utilitySlug(utility.name);
    assert.match(slug, slugPattern, utility.name);
    assert.equal(slug.length <= 60, true, utility.name);
    const kit = firstWeek(utility);
    assert.equal(kit.work.length >= 3, true, utility.name);
  }
  assert.equal(utilitySlug("Rideshare 99"), "rideshare-99");
});

test("the life sentence stays quiet until something is true", () => {
  assert.equal(lifeSentence({ missions: 0, openWork: 0, helpers: 0, featuredHelpers: 0 }), "");
  assert.equal(
    lifeSentence({ missions: 1, openWork: 2, helpers: 3, featuredHelpers: 1 }),
    "1 person can help with Rideshare 99. 2 people can help with other utilities. 2 pieces of work are open. 1 utility has been started.",
  );
});

test("the readiness canary stays addressable and stays off the public lists", async () => {
  const db = await database();
  const canary = await createFormingMission(db, creator, {
    name: "WO-0009 test Mission",
    purpose: "Prove that a verified person can start a public forming Mission.",
    beneficiaries: "The first live readiness check",
    startingPlace: "Global",
  });
  assert.equal(canary.slug, readinessCanarySlug);
  const project = await createProject(db, creator, canary.slug, {
    title: "WO-0010 test Project",
    outcome: "The public work page can show one task.",
  });
  await createWork(db, creator, canary.slug, project.slug, {
    kind: "task",
    title: "WO-0010 test task",
    description: "Confirm the public Work page shows this description.",
    doneWhen: "The signed-out page still shows this task.",
  });
  const real = await createFormingMission(db, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const realProject = await createProject(db, creator, real.slug, {
    title: "River lab",
    outcome: "Students can test the river water themselves.",
  });
  await createWork(db, creator, real.slug, realProject.slug, {
    kind: "task",
    title: "Collect sample bottles",
    description: "Bring clean bottles so the class can take water samples.",
    doneWhen: "Twenty labeled bottles are at the school.",
  });
  const missions = await listPublicMissions(db);
  assert.deepEqual(missions.map((mission) => mission.slug), [real.slug]);
  const work = await listOpenWork(db);
  assert.deepEqual(work.map((item) => item.missionSlug), [real.slug]);
  const pulse = await publicPulse(db);
  assert.equal(pulse.openWork, 1);
  assert.equal(pulse.missions, 0);
  assert.equal((await getPublicMission(db, readinessCanarySlug))?.name, "WO-0009 test Mission");
});

test("starting a catalog utility posts its first week, and another mission does not", async () => {
  const db = await database();
  const rideshare = utilities.find((utility) => utility.name === "Rideshare 99");
  assert.ok(rideshare);
  const response = await createMissionRequest(request("/api/missions", {
    name: "Rideshare 99",
    purpose: "Build Rideshare 99 in the open. A ride across town.",
    beneficiaries: "People who use it and people who operate it",
    startingPlace: "Atlanta",
  }), {
    verifySession: async () => creator,
    openDb: async () => db,
  });
  assert.equal(response.status, 201);
  const started = await findStartedUtility(db, "Rideshare 99");
  assert.equal(started?.slug, "rideshare-99");
  const work = await db.query<{ title: string }>(
    `SELECT revisions.title FROM work_items
     JOIN work_revisions revisions ON revisions.work_id = work_items.id
     ORDER BY revisions.title`,
  );
  assert.equal(work.rows.length, firstWeek(rideshare).work.length);
  assert.equal(work.rows.some((row) => row.title === "Name the first city"), true);
  await createFormingMission(db, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const after = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_items");
  assert.equal(Number(after.rows[0].n), firstWeek(rideshare).work.length);
});

test("raising a hand requires a signed-in person, consent, and a real utility", async () => {
  const db = await database();
  let opened = false;
  const deps = {
    verifySession: async (sessionCookie: string | undefined) => sessionCookie === "verified-session" ? helper : null,
    openDb: async () => {
      opened = true;
      return db;
    },
  };
  const crossOrigin = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Write the one-page description", shareEmail: true }, { origin: "https://attacker.example" }), "rideshare-99", deps);
  const unsigned = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Write the one-page description", shareEmail: true }, { signedIn: false }), "rideshare-99", deps);
  const unknown = await createOfferRequest(request("/api/utilities/not-real/offer", { piece: "Write the one-page description", shareEmail: true }), "not-real", deps);
  const refused = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Write the one-page description", shareEmail: false }), "rideshare-99", deps);
  const missingPiece = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Invent a seventh task", shareEmail: true }), "rideshare-99", deps);
  assert.equal(missingPiece.status, 400);
  assert.equal(crossOrigin.status, 403);
  assert.equal(unsigned.status, 401);
  assert.equal(unknown.status, 404);
  assert.equal(refused.status, 400);
  assert.equal(opened, false);
  assert.throws(() => offerDraft({ kind: "write", shareEmail: true, note: "x".repeat(241) }, "rideshare-99"));
});

test("a help offer is public as a count and the email is only for the person who starts it", async () => {
  const db = await database();
  const deps = { verifySession: async () => helper, openDb: async () => db };
  const created = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Write the one-page description", note: "I can write the page", shareEmail: true }), "rideshare-99", deps);
  assert.equal(created.status, 201);
  const body = await created.json() as { status: string };
  assert.equal(body.status, "offered");
  assert.equal(JSON.stringify(body).includes(helper.email), false);
  const updated = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Name the first city", note: "I can write code", shareEmail: true }), "rideshare-99", deps);
  assert.equal(updated.status, 201);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM utility_offers");
  assert.equal(Number(rows.rows[0].n), 1);
  const counts = await listPublicOfferCounts(db);
  assert.deepEqual(counts, [{ slug: "rideshare-99", count: 1 }]);
  assert.equal(JSON.stringify(counts).includes(helper.email), false);
  const pieces = await listPieceCounts(db, "rideshare-99");
  assert.deepEqual(pieces, [{ piece: "Name the first city", count: 1 }]);
  const offers = await listCreatorOffers(db, "rideshare-99");
  assert.equal(offers[0]?.email, helper.email);
  assert.equal(offers[0]?.piece, "Name the first city");
  assert.equal(offers[0]?.kind, "place");
  const pulse = await publicPulse(db);
  assert.equal(pulse.helpers, 1);
  assert.equal(pulse.featuredHelpers, 1);
  assert.equal(pulse.missions, 0);
});

test("an open invitation and a person waiting to be invited are the notices", async () => {
  const db = await database();
  const mission = await createFormingMission(db, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const project = await createProject(db, creator, mission.slug, { title: "River lab", outcome: "Students can test the river water themselves." });
  const work = await createWork(db, creator, mission.slug, project.slug, {
    kind: "task",
    title: "Collect sample bottles",
    description: "Bring clean bottles so the class can take water samples.",
    doneWhen: "Twenty labeled bottles are at the school.",
  });
  await expressInterest(db, helper, mission.slug, project.slug, work.slug, { note: "I can bring bottles.", shareEmail: true });
  assert.equal((await listGrowthNotices(db, helper.uid)).length, 0);
  const waiting = await listGrowthNotices(db, creator.uid);
  assert.equal(waiting.length, 1);
  assert.match(waiting[0].text, /Someone wants to help on Collect sample bottles/);
  const interest = await listCreatorInterests(db, mission.slug, project.slug, work.slug, creator.uid);
  await inviteInterest(db, creator, mission.slug, project.slug, work.slug, interest[0].id);
  assert.equal((await listGrowthNotices(db, creator.uid)).length, 0);
  const invited = await listGrowthNotices(db, helper.uid);
  assert.match(invited[0].text, /You're invited to help on Collect sample bottles/);
  await confirmParticipation(db, helper, mission.slug, project.slug, work.slug);
  const posted = await listGrowthNotices(db, helper.uid);
  assert.match(posted[0]?.text ?? "", /Post what you did on Collect sample bottles/);
});

const rideshareDraft = {
  name: "Rideshare 99",
  purpose: "Build Rideshare 99 in the open. A ride across town.",
  beneficiaries: "People who use it and people who operate it",
  startingPlace: "Atlanta",
};

test("starting a utility invites the people already on a piece, and not the person who started it", async () => {
  const db = await database();
  const piece = { piece: "Write the one-page description", note: "I can write the page", shareEmail: true };
  await createOfferRequest(request("/api/utilities/rideshare-99/offer", piece), "rideshare-99", { verifySession: async () => helper, openDb: async () => db });
  await createOfferRequest(request("/api/utilities/rideshare-99/offer", piece), "rideshare-99", { verifySession: async () => creator, openDb: async () => db });
  const waiting = await listGrowthNotices(db, helper.uid);
  assert.match(waiting[0]?.text ?? "", /You're on Write the one-page description/);
  assert.match(waiting[0]?.href ?? "", /piece=Write%20the%20one-page%20description/);
  const started = await createMissionRequest(request("/api/missions", rideshareDraft), { verifySession: async () => creator, openDb: async () => db });
  assert.equal(started.status, 201);
  const invited = await db.query<{ invited_by_uid: string; human_uid: string }>(
    `SELECT work_invitations.invited_by_uid, work_interests.human_uid
     FROM work_invitations JOIN work_interests ON work_interests.id = work_invitations.interest_id`,
  );
  assert.equal(invited.rows.length, 1);
  assert.equal(invited.rows[0].invited_by_uid, creator.uid);
  assert.equal(invited.rows[0].human_uid, helper.uid);
  const notices = await listGrowthNotices(db, helper.uid);
  assert.equal(notices.length, 1);
  assert.match(notices[0].text, /You're invited to help on Write the one-page description/);
  assert.equal(notices[0].href, "/use/rideshare-99?piece=Write%20the%20one-page%20description#help");
  assert.equal((await listGrowthNotices(db, creator.uid)).length, 0);
});

test("raising a hand after a utility has started invites that person to the piece", async () => {
  const db = await database();
  const started = await createMissionRequest(request("/api/missions", rideshareDraft), { verifySession: async () => creator, openDb: async () => db });
  assert.equal(started.status, 201);
  const deps = { verifySession: async () => helper, openDb: async () => db };
  const created = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Name the first city", note: "Atlanta", shareEmail: true }), "rideshare-99", deps);
  assert.equal(created.status, 201);
  const body = await created.json() as { status: string; next?: string };
  assert.equal(body.status, "offered");
  assert.match(body.next ?? "", /^\/missions\/rideshare-99\/projects\/[^/]+\/work\/[^/]+$/);
  assert.equal(JSON.stringify(body).includes(helper.email), false);
  const notices = await listGrowthNotices(db, helper.uid);
  assert.match(notices[0]?.text ?? "", /Post what you did on Name the first city/);
  assert.equal(notices[0]?.href, body.next);
  const confirmed = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_confirmations");
  assert.equal(Number(confirmed.rows[0].n), 1);
  assert.equal((await listGrowthNotices(db, creator.uid)).length, 0);
  const again = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Name the first city", note: "Atlanta", shareEmail: true }), "rideshare-99", deps);
  const againBody = await again.json() as { next?: string };
  assert.equal(againBody.next, body.next);
  const invitations = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM work_invitations");
  assert.equal(Number(invitations.rows[0].n), 1);
});

test("taking Look after the list starts the utility and invites people already waiting", async () => {
  const db = await database();
  const later = { uid: "human-3", email: "later@example.test" };
  await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Write the one-page description", note: "I can write the page", shareEmail: true }), "rideshare-99", { verifySession: async () => helper, openDb: async () => db });
  const opened = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Look after the list", note: "I can keep the list", shareEmail: true }), "rideshare-99", { verifySession: async () => creator, openDb: async () => db });
  assert.equal(opened.status, 201);
  const body = await opened.json() as { status: string; next?: string };
  assert.equal(body.status, "offered");
  assert.equal(body.next, "/missions/rideshare-99");
  assert.equal(JSON.stringify(body).includes(creator.email), false);
  const place = await db.query<{ starting_place: string }>("SELECT starting_place FROM mission_revisions");
  assert.equal(place.rows[0]?.starting_place, "Not named yet");
  const invited = await db.query<{ invited_by_uid: string; human_uid: string }>(
    `SELECT work_invitations.invited_by_uid, work_interests.human_uid
     FROM work_invitations JOIN work_interests ON work_interests.id = work_invitations.interest_id`,
  );
  assert.equal(invited.rows.length, 1);
  assert.equal(invited.rows[0].invited_by_uid, creator.uid);
  assert.equal(invited.rows[0].human_uid, helper.uid);
  assert.equal((await listGrowthNotices(db, creator.uid)).length, 0);
  const second = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { piece: "Look after the list", note: "I can help keep it", shareEmail: true }), "rideshare-99", { verifySession: async () => later, openDb: async () => db });
  const secondBody = await second.json() as { next?: string };
  assert.match(secondBody.next ?? "", /^\/missions\/rideshare-99\/projects\/[^/]+\/work\/[^/]+$/);
  const missions = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM missions");
  assert.equal(Number(missions.rows[0].n), 1);
});
