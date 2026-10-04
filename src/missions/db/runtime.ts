import path from "node:path";
import { missionDatabaseUnavailable, parseMissionProductionConfig } from "./config";
import type { MissionDb } from "./client";
import { assertMissionEnvironment } from "../environment";

const shared = globalThis as typeof globalThis & { __pct99MissionDb?: Promise<MissionDb> };

export async function connectProductionMissionDb(env: Record<string, string | undefined>, open: (config: ReturnType<typeof parseMissionProductionConfig>) => Promise<MissionDb & { close(): Promise<void> }>) {
  const config = parseMissionProductionConfig(env);
  let db: (MissionDb & { close(): Promise<void> }) | undefined;
  try {
    db = await open(config);
    await assertMissionEnvironment(db, config);
    return db;
  } catch (error) {
    await db?.close();
    if (error instanceof Error && error.message === missionDatabaseUnavailable) throw error;
    throw new Error(missionDatabaseUnavailable);
  }
}

export async function getMissionDb(): Promise<MissionDb> {
  if (!shared.__pct99MissionDb) {
    shared.__pct99MissionDb = (async () => {
      if (process.env.NODE_ENV !== "production") {
        const [{ PGlite }, { embeddedMissionDb }, { migrateMissions }] = await Promise.all([
          import("@electric-sql/pglite"),
          import("./client"),
          import("./migrate"),
        ]);
        const directory = process.env.MISSION_DEV_DB_DIR;
        const embedded = new PGlite(directory ? path.resolve(directory) : undefined);
        const db = embeddedMissionDb(embedded);
        await migrateMissions(db);
        return db;
      }
      const { googleCloudSqlConnector, openCloudSqlMissionDb } = await import("./cloud-sql");
      return connectProductionMissionDb(process.env, async (config) => openCloudSqlMissionDb(config, await googleCloudSqlConnector()));
    })().catch((error) => {
      shared.__pct99MissionDb = undefined;
      throw error;
    });
  }
  return shared.__pct99MissionDb;
}
