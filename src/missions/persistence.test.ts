import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { PoolConfig } from "pg";
import { embeddedMissionDb, configuredMissionDb } from "./db/client";
import { openCloudSqlMissionDb } from "./db/cloud-sql";
import { missionDatabaseUnavailable, missionPoolMax, parseMissionProductionConfig } from "./db/config";
import { migrateMissions } from "./db/migrate";
import { connectProductionMissionDb } from "./db/runtime";
import { MissionBindingError, assertMissionEnvironment, bindMissionEnvironment } from "./environment";

const instance = "pct-99:us-central1:pct99-missions-prod";

function productionEnv(databaseName: string): Record<string, string | undefined> {
  return {
    MISSION_RELEASE_TARGET: "production",
    MISSION_DB_INSTANCE: instance,
    MISSION_DB_NAME: databaseName,
    MISSION_DB_USER: "missions_runtime",
    MISSION_DB_PASSWORD: "runtime-secret",
    FIREBASE_PROJECT_ID: "pct-99",
    DATABASE_URL: "postgresql://workspace.example/workspace",
  };
}

test("production Mission config ignores the workspace database URL and fails closed", () => {
  const parsed = parseMissionProductionConfig(productionEnv("missions"));
  assert.equal(parsed.databaseName, "missions");
  assert.equal(parsed.instanceConnectionName, instance);
  assert.equal(JSON.stringify(parsed).includes("workspace.example"), false);
  assert.throws(() => parseMissionProductionConfig({ ...productionEnv("missions"), MISSION_DB_INSTANCE: "35.219.200.1" }), (error: unknown) => error instanceof Error && error.message === missionDatabaseUnavailable);
});

test("malformed production Mission config uses a generic error", () => {
  assert.throws(() => parseMissionProductionConfig({ DATABASE_URL: "postgresql://workspace.example/workspace", MISSION_DB_PASSWORD: "short" }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(error.message, missionDatabaseUnavailable);
    assert.equal(error.message.includes("short"), false);
    assert.equal(error.message.includes("workspace"), false);
    return true;
  });
});

test("the Mission database does not silently use the workspace database", () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://workspace.example/workspace";
  try {
    assert.throws(() => configuredMissionDb(), new RegExp(missionDatabaseUnavailable));
    assert.throws(() => configuredMissionDb(process.env.DATABASE_URL), new RegExp(missionDatabaseUnavailable));
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});

test("the Cloud SQL adapter requests connector options and a small pool", async () => {
  let seen = "";
  let closed = false;
  let pooled: PoolConfig | undefined;
  const config = parseMissionProductionConfig(productionEnv("missions"));
  const db = await openCloudSqlMissionDb(config, {
    getOptions: async (request) => {
      seen = request.instanceConnectionName;
      return { stream: () => { throw new Error("no network"); } };
    },
    close: async () => { closed = true; },
  }, (poolConfig) => {
    pooled = poolConfig;
    return { end: async () => undefined } as never;
  });
  assert.equal(seen, instance);
  assert.equal(pooled?.max, missionPoolMax);
  assert.equal(pooled?.database, "missions");
  assert.equal(pooled?.user, "missions_runtime");
  assert.equal("connectionString" in (pooled || {}), false);
  assert.equal("host" in (pooled || {}), false);
  await db.close();
  assert.equal(closed, true);
});

test("environment binding is idempotent only when every value matches", async () => {
  const embedded = new PGlite();
  const db = embeddedMissionDb(embedded);
  await migrateMissions(db);
  const databaseName = (await db.query<{ name: string }>("SELECT current_database() AS name")).rows[0].name;
  const identity = { target: "staging" as const, projectId: "pct-99", databaseName, instanceConnectionName: instance };
  assert.equal((await bindMissionEnvironment(db, identity)).alreadyBound, false);
  assert.equal((await bindMissionEnvironment(db, identity)).alreadyBound, true);
  await assertMissionEnvironment(db, identity);
  await assert.rejects(bindMissionEnvironment(db, { ...identity, instanceConnectionName: "pct-99:us-central1:other-instance" }), MissionBindingError);
  await embedded.close();
});

test("production connection checks the binding and does not migrate", async () => {
  const embedded = new PGlite();
  const db = embeddedMissionDb(embedded);
  await migrateMissions(db);
  const databaseName = (await db.query<{ name: string }>("SELECT current_database() AS name")).rows[0].name;
  await bindMissionEnvironment(db, { target: "production", projectId: "pct-99", databaseName, instanceConnectionName: instance });
  const seen: string[] = [];
  const wrapped = {
    ...db,
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => {
      seen.push(sql);
      return db.query<T>(sql, params);
    },
    close: async () => undefined,
  };
  await connectProductionMissionDb(productionEnv(databaseName), async () => wrapped);
  assert.equal(seen.some((sql) => sql.includes("INSERT INTO mission_schema_migrations")), false);
  await assert.rejects(connectProductionMissionDb(productionEnv(databaseName), async () => {
    throw new Error("dial secret instance pct-99");
  }), (error: unknown) => error instanceof Error && error.message === missionDatabaseUnavailable && !error.message.includes("secret"));
  await embedded.close();
});
