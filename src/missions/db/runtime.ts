import path from "node:path";
import type { MissionDb } from "./client";

const shared = globalThis as typeof globalThis & { __pct99MissionDb?: Promise<MissionDb> };

export async function getMissionDb(): Promise<MissionDb> {
  if (!shared.__pct99MissionDb) {
    shared.__pct99MissionDb = (async () => {
      if (process.env.NODE_ENV === "production") throw new Error("Mission database is not configured.");
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
    })().catch((error) => {
      shared.__pct99MissionDb = undefined;
      throw error;
    });
  }
  return shared.__pct99MissionDb;
}
