import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedMissionDb } from "./client";
import { migrateMissions, missionMigrationPrefixCurrent, type MissionMigrationRecord } from "./migrate";

const known = [
  { name: "0001_missions.sql", sha256: "a" },
  { name: "0002_environment.sql", sha256: "b" },
];

test("an older migration set stays current when the database is ahead by a later additive migration", () => {
  const installed = [...known, { name: "0003_projects_work.sql", sha256: "c" }];
  assert.equal(missionMigrationPrefixCurrent(known, installed), true);
});

test("a missing migration known to the app is not current", () => {
  assert.equal(missionMigrationPrefixCurrent(known, [known[0]]), false);
  assert.equal(missionMigrationPrefixCurrent(known, [known[0], { name: "0003_projects_work.sql", sha256: "c" }]), false);
});

test("a changed checksum for a known migration is not current", () => {
  assert.equal(missionMigrationPrefixCurrent(known, [{ ...known[0], sha256: "changed" }, known[1]]), false);
});

test("migration history that is not an ordered prefix is not current", () => {
  const reversed = [known[1], known[0]];
  const inserted = [known[0], { name: "0001_other.sql", sha256: "c" }, known[1]];
  const earlier = [{ name: "0000_prior.sql", sha256: "z" }, ...known];
  assert.equal(missionMigrationPrefixCurrent(known, reversed), false);
  assert.equal(missionMigrationPrefixCurrent(known, inserted), false);
  assert.equal(missionMigrationPrefixCurrent(known, earlier), false);
});

test("the retained WO-0009 migration set accepts a database that already includes 0003", async () => {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  const installed = await db.query<MissionMigrationRecord>("SELECT name, sha256 FROM mission_schema_migrations ORDER BY name");
  const retained = await Promise.all(["0001_missions.sql", "0002_environment.sql"].map(async (name) => {
    const sql = await readFile(new URL(`./migrations/${name}`, import.meta.url), "utf8");
    return { name, sha256: createHash("sha256").update(sql).digest("hex") };
  }));
  assert.equal(installed.rows.some((row) => row.name === "0003_projects_work.sql"), true);
  assert.equal(missionMigrationPrefixCurrent(retained, installed.rows), true);
});

test("the migration runner still refuses history beyond the files it knows", async () => {
  const db = embeddedMissionDb(new PGlite());
  await migrateMissions(db);
  await db.query("INSERT INTO mission_schema_migrations (name, sha256) VALUES ('0004_later.sql', 'later')");
  await assert.rejects(() => migrateMissions(db), /out of order or missing/);
});
