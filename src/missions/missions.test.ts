import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { POST, createMissionRequest } from "../app/api/missions/route";
import { embeddedMissionDb, configuredMissionDb, type MissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { MissionInputError, missionDraft } from "./model";
import { createFormingMission, listPublicMissions } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const draft = {
  name: "River School",
  purpose: "Teach children how the river works.",
  beneficiaries: "Children in the valley",
  startingPlace: "Global",
};

async function database() {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  return db;
}

test("a verified human can start a forming Mission and the public view hides the creator email", async () => {
  const db = await database();
  const created = await createFormingMission(db, creator, draft);
  assert.equal(created.status, "forming");
  assert.equal(created.slug, "river-school");
  assert.equal(JSON.stringify(created).includes(creator.email), false);
  const listed = await listPublicMissions(db);
  assert.equal(listed.length, 1);
  assert.equal(JSON.stringify(listed).includes(creator.email), false);
  const stored = await db.query<{ verified_email: string }>("SELECT verified_email FROM human_accounts");
  assert.equal(stored.rows[0].verified_email, creator.email);
});

test("description revisions are append-only", async () => {
  const db = await database();
  await createFormingMission(db, creator, draft);
  await assert.rejects(() => db.query("UPDATE mission_revisions SET name = 'Renamed'"), /append-only/);
  await assert.rejects(() => db.query("DELETE FROM mission_revisions"), /append-only/);
  const revisions = await db.query<{ name: string }>("SELECT name FROM mission_revisions");
  assert.equal(revisions.rows[0].name, draft.name);
});

test("slug collisions reserve a new slug and do not overwrite the first Mission", async () => {
  const db = await database();
  const first = await createFormingMission(db, creator, draft);
  const second = await createFormingMission(db, { uid: "human-2", email: "second@example.test" }, draft);
  assert.equal(first.slug, "river-school");
  assert.equal(second.slug, "river-school-2");
  const rows = await db.query<{ slug: string; name: string }>(
    "SELECT missions.slug, revisions.name FROM missions JOIN mission_revisions revisions ON revisions.mission_id = missions.id ORDER BY missions.slug",
  );
  assert.deepEqual(rows.rows.map((row) => row.slug), ["river-school", "river-school-2"]);
  assert.deepEqual(rows.rows.map((row) => row.name), [draft.name, draft.name]);
});

test("public Missions are listed newest first", async () => {
  const db = await database();
  const older = await createFormingMission(db, creator, draft);
  await db.query("UPDATE missions SET created_at = now() - interval '1 day' WHERE slug = $1", [older.slug]);
  const newer = await createFormingMission(db, creator, { ...draft, name: "Harbor Clinic", purpose: "Open a clinic by the harbor." });
  const listed = await listPublicMissions(db);
  assert.deepEqual(listed.map((mission) => mission.slug), [newer.slug, older.slug]);
});

test("invalid and oversized Mission fields are refused before a row is written", async () => {
  const db = await database();
  assert.throws(() => missionDraft({ ...draft, name: "A" }), MissionInputError);
  assert.throws(() => missionDraft({ ...draft, purpose: "x".repeat(501) }), MissionInputError);
  const count = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM missions");
  assert.equal(Number(count.rows[0].n), 0);
});

test("a failed revision insert cannot leave a half-created Mission", async () => {
  const db = await database();
  const failing: MissionDb = {
    ...db,
    transaction: (work) => db.transaction((tx) => work({
      ...tx,
      query: async (sql, params) => {
        if (sql.includes("INSERT INTO mission_revisions")) throw new Error("revision failed");
        return tx.query(sql, params);
      },
    })),
  };
  await assert.rejects(() => createFormingMission(failing, creator, draft), /revision failed/);
  const missions = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM missions");
  const accounts = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM human_accounts");
  assert.equal(Number(missions.rows[0].n), 0);
  assert.equal(Number(accounts.rows[0].n), 0);
});

test("Mission creation refuses a missing session and a cross-origin request", async () => {
  const token = "c".repeat(64);
  const url = "http://localhost:3000/api/missions";
  const payload = JSON.stringify({ csrfToken: token, ...draft });
  const unsigned = await POST(new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", cookie: `human_csrf=${token}` },
    body: payload,
  }));
  const crossOrigin = await POST(new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example", cookie: `human_csrf=${token}` },
    body: payload,
  }));
  assert.equal(unsigned.status, 401);
  assert.equal(crossOrigin.status, 403);
});

function missionRequest(body: Record<string, unknown>) {
  const token = "c".repeat(64);
  return new NextRequest("http://localhost:3000/api/missions", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", cookie: `human_csrf=${token}; human_session=verified-session` },
    body: JSON.stringify({ csrfToken: token, ...body }),
  });
}

test("an authenticated Mission request returns the public URL and persists revision 1", async () => {
  const db = await database();
  const response = await createMissionRequest(missionRequest(draft), {
    verifySession: async () => creator,
    openDb: async () => db,
  });
  assert.equal(response.status, 201);
  const body = await response.json() as { url: string };
  assert.equal(body.url, "/missions/river-school");
  assert.equal(JSON.stringify(body).includes(creator.email), false);
  const listed = await listPublicMissions(db);
  assert.equal(listed.length, 1);
  assert.equal(JSON.stringify(listed).includes(creator.email), false);
  const revisions = await db.query<{ revision: number }>("SELECT revision FROM mission_revisions");
  assert.equal(Number(revisions.rows[0].revision), 1);
});

test("invalid Mission input returns 400 before the Mission database is opened", async () => {
  let opened = false;
  const response = await createMissionRequest(missionRequest({ ...draft, name: "A" }), {
    verifySession: async () => creator,
    openDb: async () => {
      opened = true;
      throw new Error("database opened");
    },
  });
  assert.equal(response.status, 400);
  assert.equal(opened, false);
});

test("the Mission database does not silently use the workspace database", () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://workspace.example/workspace";
  delete process.env.MISSION_DATABASE_URL;
  try {
    assert.throws(() => configuredMissionDb(), /not configured/);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
