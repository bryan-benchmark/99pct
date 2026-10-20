import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { createMissionRequest } from "../app/api/missions/route";
import { createOfferRequest } from "../app/api/utilities/[slug]/offer/route";
import { utilities, utilitySlug } from "@/content/utilities";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { findStartedUtility, lifeSentence, listGrowthNotices, publicPulse } from "./growth";
import { expressInterest, listCreatorInterests } from "./interest";
import { confirmParticipation, inviteInterest } from "./participation";
import { listCreatorOffers, listPublicOfferCounts, offerDraft } from "./offers";
import { createProject, createWork } from "./projects";
import { firstWeek } from "./starter";
import { createFormingMission } from "./store";

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
  const crossOrigin = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { kind: "write", shareEmail: true }, { origin: "https://attacker.example" }), "rideshare-99", deps);
  const unsigned = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { kind: "write", shareEmail: true }, { signedIn: false }), "rideshare-99", deps);
  const unknown = await createOfferRequest(request("/api/utilities/not-real/offer", { kind: "write", shareEmail: true }), "not-real", deps);
  const refused = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { kind: "write", shareEmail: false }), "rideshare-99", deps);
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
  const created = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { kind: "write", note: "I can write the page", shareEmail: true }), "rideshare-99", deps);
  assert.equal(created.status, 201);
  const body = await created.json() as { status: string };
  assert.equal(body.status, "offered");
  assert.equal(JSON.stringify(body).includes(helper.email), false);
  const updated = await createOfferRequest(request("/api/utilities/rideshare-99/offer", { kind: "code", note: "I can write code", shareEmail: true }), "rideshare-99", deps);
  assert.equal(updated.status, 201);
  const rows = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM utility_offers");
  assert.equal(Number(rows.rows[0].n), 1);
  const counts = await listPublicOfferCounts(db);
  assert.deepEqual(counts, [{ slug: "rideshare-99", count: 1 }]);
  assert.equal(JSON.stringify(counts).includes(helper.email), false);
  const offers = await listCreatorOffers(db, "rideshare-99");
  assert.equal(offers[0]?.email, helper.email);
  assert.equal(offers[0]?.kind, "code");
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
  assert.equal((await listGrowthNotices(db, helper.uid)).length, 0);
});
