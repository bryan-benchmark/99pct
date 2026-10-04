import type { WorkspaceDb } from "./db/client";

export type WorkspaceReleaseTarget = "staging" | "production";

export function parseWorkspaceReleaseTarget(value: string | undefined): WorkspaceReleaseTarget {
  if (value !== "staging" && value !== "production") throw new Error("Workspace release target must be staging or production.");
  return value;
}

export function assertWorkspaceRuntimeTargetPresent(env: Record<string, string | undefined>) {
  if (env.WORKSPACE_RELEASE_TARGET || env.NODE_ENV !== "production") return;
  if (env.WORKSPACE_LOCAL_TEST_RUNTIME === "1" && localTestRuntimeConfigured(env)) return;
  throw new Error("Workspace production runtime requires an explicit release target.");
}

function localTestRuntimeConfigured(env: Record<string, string | undefined>) {
  if (!/^(?:localhost|127\.0\.0\.1|\[::1\]):\d{1,5}$/.test(env.FIREBASE_AUTH_EMULATOR_HOST || "")) return false;
  try {
    const clientEmulator = new URL(env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "");
    const database = new URL(env.DATABASE_URL || "");
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return clientEmulator.protocol === "http:"
      && loopback.has(clientEmulator.hostname)
      && (database.protocol === "postgres:" || database.protocol === "postgresql:")
      && loopback.has(database.hostname)
      && !database.search
      && !database.hash
      && decodeURIComponent(database.pathname).endsWith("_check")
      && env.FIREBASE_PROJECT_ID === env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      && !!env.FIREBASE_PROJECT_ID?.startsWith("demo-");
  } catch { return false; }
}

export async function bindWorkspaceEnvironment(db: WorkspaceDb, target: WorkspaceReleaseTarget, expectedDatabaseName: string, firebaseProjectId: string) {
  if (!expectedDatabaseName || expectedDatabaseName.trim() !== expectedDatabaseName) throw new Error("An expected database name is required.");
  if (!firebaseProjectId || firebaseProjectId.trim() !== firebaseProjectId || firebaseProjectId.length < 3 || firebaseProjectId.length > 128 || firebaseProjectId.startsWith("demo-")) throw new Error("A live Firebase project ID is required.");
  return db.transaction(async (tx) => {
    const identity = await tx.query<{ name: string }>("SELECT current_database() AS name");
    if (identity.rows[0]?.name !== expectedDatabaseName) throw new Error("Connected database does not match the expected name.");
    const existing = await tx.query<{ target: string; firebase_project_id: string | null }>("SELECT target, firebase_project_id FROM workspace_environment WHERE singleton = 1 FOR UPDATE");
    if (existing.rows[0]) {
      if (existing.rows[0].target !== target) throw new Error("Database is already bound to a different workspace environment.");
      if (existing.rows[0].firebase_project_id && existing.rows[0].firebase_project_id !== firebaseProjectId) throw new Error("Database is already bound to a different Firebase project.");
      if (!existing.rows[0].firebase_project_id) {
        await tx.query("UPDATE workspace_environment SET firebase_project_id = $1 WHERE singleton = 1", [firebaseProjectId]);
        return { target, firebaseProjectId, alreadyBound: false };
      }
      return { target, firebaseProjectId, alreadyBound: true };
    }
    await tx.query("INSERT INTO workspace_environment(singleton, target, firebase_project_id) VALUES (1, $1, $2)", [target, firebaseProjectId]);
    return { target, firebaseProjectId, alreadyBound: false };
  });
}

export async function assertWorkspaceEnvironment(db: WorkspaceDb, target: WorkspaceReleaseTarget, firebaseProjectId: string) {
  const bound = await db.query<{ target: string; firebase_project_id: string | null }>("SELECT target, firebase_project_id FROM workspace_environment WHERE singleton = 1");
  if (bound.rows[0]?.target !== target) throw new Error("Workspace database environment does not match the runtime target.");
  if (!firebaseProjectId || bound.rows[0].firebase_project_id !== firebaseProjectId) throw new Error("Workspace database Firebase project does not match the runtime project.");
}

export function assertWorkspaceRuntimeReleaseConfig(env: Record<string, string | undefined>, target: WorkspaceReleaseTarget) {
  const browserProject = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serverProject = env.FIREBASE_PROJECT_ID || env.GOOGLE_CLOUD_PROJECT;
  if (!browserProject || browserProject.startsWith("demo-") || !serverProject || serverProject !== browserProject) {
    throw new Error("Workspace runtime Firebase project does not match the browser project.");
  }
  if (env.FIREBASE_AUTH_EMULATOR_HOST || env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || env.WORKSPACE_DEV_DB_DIR || env.WORKSPACE_LOCAL_TEST_RUNTIME) {
    throw new Error(`Workspace ${target} runtime cannot use local emulators or embedded storage.`);
  }
}
