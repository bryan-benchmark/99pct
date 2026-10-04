import path from "node:path";
import type { WorkspaceDb } from "./client";
import { productionWorkspaceDb } from "./client";
import { assertWorkspaceEnvironment, assertWorkspaceRuntimeReleaseConfig, assertWorkspaceRuntimeTargetPresent, parseWorkspaceReleaseTarget } from "../environment";

const shared = globalThis as typeof globalThis & { __missionWorkspaceDb?: Promise<WorkspaceDb> };

export async function getWorkspaceDb(): Promise<WorkspaceDb> {
  if (!shared.__missionWorkspaceDb) {
    shared.__missionWorkspaceDb = (async () => {
      const devDirectory = process.env.WORKSPACE_DEV_DB_DIR;
      if (process.env.NODE_ENV !== "production" && devDirectory) {
        const [{ PGlite }, { embeddedWorkspaceDb }, { migrateWorkspace }] = await Promise.all([
          import("@electric-sql/pglite"),
          import("./client"),
          import("./migrate"),
        ]);
        const embedded = new PGlite(path.resolve(devDirectory));
        const db = embeddedWorkspaceDb(embedded);
        await migrateWorkspace(db);
        return db;
      }
      const releaseTarget = process.env.WORKSPACE_RELEASE_TARGET;
      if (!releaseTarget) {
        assertWorkspaceRuntimeTargetPresent(process.env);
        return productionWorkspaceDb();
      }
      const target = parseWorkspaceReleaseTarget(releaseTarget);
      assertWorkspaceRuntimeReleaseConfig(process.env, target);
      const db = productionWorkspaceDb();
      try {
        await assertWorkspaceEnvironment(db, target, process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "");
        return db;
      } catch (error) {
        await db.close();
        throw error;
      }
    })().catch((error) => {
      shared.__missionWorkspaceDb = undefined;
      throw error;
    });
  }
  return shared.__missionWorkspaceDb;
}
