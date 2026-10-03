import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb } from "./db/client";
import { migrateWorkspace } from "./db/migrate";
import { assertWorkspaceEnvironment, assertWorkspaceRuntimeReleaseConfig, assertWorkspaceRuntimeTargetPresent, bindWorkspaceEnvironment, parseWorkspaceReleaseTarget } from "./environment";

test("workspace database binding is one-time and checks the actual database name", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const name = (await db.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    assert.ok(name);
    await assert.rejects(assertWorkspaceEnvironment(db, "staging", "missionism-staging"), /does not match/);
    await assert.rejects(bindWorkspaceEnvironment(db, "staging", "wrong_database", "missionism-staging"), /does not match/);
    await assert.rejects(bindWorkspaceEnvironment(db, "staging", name, "demo-staging"), /live Firebase project/);
    assert.deepEqual(await bindWorkspaceEnvironment(db, "staging", name, "missionism-staging"), { target: "staging", firebaseProjectId: "missionism-staging", alreadyBound: false });
    assert.deepEqual(await bindWorkspaceEnvironment(db, "staging", name, "missionism-staging"), { target: "staging", firebaseProjectId: "missionism-staging", alreadyBound: true });
    await assertWorkspaceEnvironment(db, "staging", "missionism-staging");
    await assert.rejects(assertWorkspaceEnvironment(db, "staging", "another-staging-project"), /Firebase project does not match/);
    await assert.rejects(bindWorkspaceEnvironment(db, "staging", name, "another-staging-project"), /already bound to a different Firebase project/);
    await assert.rejects(assertWorkspaceEnvironment(db, "production", "missionism-staging"), /does not match/);
    await assert.rejects(bindWorkspaceEnvironment(db, "production", name, "missionism-staging"), /already bound/);
    const stored = await db.query<{ target: string; firebase_project_id: string }>("SELECT target, firebase_project_id FROM workspace_environment");
    assert.equal(stored.rows[0]?.target, "staging");
    assert.equal(stored.rows[0]?.firebase_project_id, "missionism-staging");
  } finally { await embedded.close(); }
});

test("a preexisting target binding requires an explicit Firebase project claim", async () => {
  const embedded = new PGlite();
  try {
    const db = embeddedWorkspaceDb(embedded);
    await migrateWorkspace(db);
    const name = (await db.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    assert.ok(name);
    await db.query("INSERT INTO workspace_environment(target) VALUES ('staging')");
    await assert.rejects(assertWorkspaceEnvironment(db, "staging", "missionism-staging"), /Firebase project does not match/);
    assert.deepEqual(await bindWorkspaceEnvironment(db, "staging", name, "missionism-staging"), { target: "staging", firebaseProjectId: "missionism-staging", alreadyBound: false });
    await assertWorkspaceEnvironment(db, "staging", "missionism-staging");
  } finally { await embedded.close(); }
});

test("workspace release runtime requires a matching live Firebase project", () => {
  const valid = { NEXT_PUBLIC_FIREBASE_PROJECT_ID: "missionism-staging", FIREBASE_PROJECT_ID: "missionism-staging" };
  assert.equal(parseWorkspaceReleaseTarget("staging"), "staging");
  assert.throws(() => parseWorkspaceReleaseTarget("preview"), /must be staging or production/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ NODE_ENV: "production" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ NODE_ENV: "production", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" }), /explicit release target/);
  assert.doesNotThrow(() => assertWorkspaceRuntimeReleaseConfig(valid, "staging"));
  assert.throws(() => assertWorkspaceRuntimeReleaseConfig({ ...valid, FIREBASE_PROJECT_ID: "missionism-production" }, "staging"), /does not match/);
  assert.throws(() => assertWorkspaceRuntimeReleaseConfig({ ...valid, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" }, "staging"), /cannot use local emulators/);
  assert.throws(() => assertWorkspaceRuntimeReleaseConfig({ ...valid, WORKSPACE_LOCAL_TEST_RUNTIME: "1" }, "staging"), /cannot use local emulators/);
});

test("production-mode local workflow requires an explicit disposable loopback setup", () => {
  const local = {
    NODE_ENV: "production", WORKSPACE_LOCAL_TEST_RUNTIME: "1",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9099",
    FIREBASE_PROJECT_ID: "demo-missionism", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-missionism",
    DATABASE_URL: "postgresql://tester@127.0.0.1:55432/missionism_workspace_check",
  };
  assert.doesNotThrow(() => assertWorkspaceRuntimeTargetPresent(local));
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, WORKSPACE_LOCAL_TEST_RUNTIME: undefined }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, DATABASE_URL: "postgresql://tester@managed.example.com:5432/missionism_workspace_check" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, DATABASE_URL: "postgresql://tester@127.0.0.1:55432/missionism_workspace_check?host=managed.example.com" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, DATABASE_URL: "postgresql://tester@127.0.0.1:55432/customer_data" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, FIREBASE_AUTH_EMULATOR_HOST: "managed.example.com:9099" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "https://managed.example.com" }), /explicit release target/);
  assert.throws(() => assertWorkspaceRuntimeTargetPresent({ ...local, FIREBASE_PROJECT_ID: "missionism-production" }), /explicit release target/);
});
