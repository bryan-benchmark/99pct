import type { MissionDb } from "./db/client";
import { missionDatabaseUnavailable, type MissionProductionConfig, type MissionReleaseTarget } from "./db/config";

export class MissionBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionBindingError";
  }
}

type BindingRow = {
  release_target: string;
  firebase_project_id: string;
  database_name: string;
  instance_connection_name: string;
};

export async function bindMissionEnvironment(db: MissionDb, config: Pick<MissionProductionConfig, "target" | "projectId" | "databaseName" | "instanceConnectionName">) {
  return db.transaction(async (tx) => {
    const identity = await tx.query<{ name: string }>("SELECT current_database() AS name");
    if (identity.rows[0]?.name !== config.databaseName) throw new MissionBindingError("Connected database does not match the expected name.");
    const existing = await tx.query<BindingRow>(
      `SELECT release_target, firebase_project_id, database_name, instance_connection_name
         FROM mission_environment WHERE singleton = 1 FOR UPDATE`,
    );
    const row = existing.rows[0];
    if (row) {
      const matches = row.release_target === config.target
        && row.firebase_project_id === config.projectId
        && row.database_name === config.databaseName
        && row.instance_connection_name === config.instanceConnectionName;
      if (!matches) throw new MissionBindingError("Database is already bound to a different Mission environment.");
      return { alreadyBound: true };
    }
    await tx.query(
      `INSERT INTO mission_environment (singleton, release_target, firebase_project_id, database_name, instance_connection_name)
       VALUES (1, $1, $2, $3, $4)`,
      [config.target, config.projectId, config.databaseName, config.instanceConnectionName],
    );
    return { alreadyBound: false };
  });
}

export async function assertMissionEnvironment(db: MissionDb, config: Pick<MissionProductionConfig, "target" | "projectId" | "databaseName" | "instanceConnectionName">) {
  const identity = await db.query<{ name: string }>("SELECT current_database() AS name");
  const bound = await db.query<BindingRow>(
    `SELECT release_target, firebase_project_id, database_name, instance_connection_name
       FROM mission_environment WHERE singleton = 1`,
  );
  const row = bound.rows[0];
  if (identity.rows[0]?.name !== config.databaseName || !row
    || row.release_target !== config.target
    || row.firebase_project_id !== config.projectId
    || row.database_name !== config.databaseName
    || row.instance_connection_name !== config.instanceConnectionName) {
    throw new MissionBindingError(missionDatabaseUnavailable);
  }
}

export function missionReleaseTarget(value: string | undefined): MissionReleaseTarget {
  if (value !== "staging" && value !== "production") throw new MissionBindingError("Mission release target must be staging or production.");
  return value;
}
