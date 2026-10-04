import assert from "node:assert/strict";
import test from "node:test";
import { assertWorkspaceReleaseBuildConfig } from "./build-config";

const live = {
  WORKSPACE_RELEASE_TARGET: "staging",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "missionism-staging-example",
  NEXT_PUBLIC_FIREBASE_API_KEY: "example-public-firebase-key-value",
  FIREBASE_PROJECT_ID: "missionism-staging-example",
};

test("public protocol builds can omit workspace identity settings", () => {
  assert.doesNotThrow(() => assertWorkspaceReleaseBuildConfig({}));
});

test("workspace release build requires matching live Firebase client settings", () => {
  assert.doesNotThrow(() => assertWorkspaceReleaseBuildConfig(live));
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, NEXT_PUBLIC_FIREBASE_API_KEY: undefined }), /needs a live Firebase/);
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-missionism" }), /needs a live Firebase/);
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, FIREBASE_PROJECT_ID: "another-project" }), /project IDs differ/);
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://localhost:9099" }), /cannot use local emulators/);
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, WORKSPACE_LOCAL_TEST_RUNTIME: "1" }), /cannot use local emulators/);
  assert.throws(() => assertWorkspaceReleaseBuildConfig({ ...live, WORKSPACE_RELEASE_TARGET: "preview" }), /must be staging or production/);
});
