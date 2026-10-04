export const missionDatabaseUnavailable = "Mission database is not configured.";
export const missionPoolMax = 5;

export type MissionReleaseTarget = "staging" | "production";

export type MissionProductionConfig = {
  target: MissionReleaseTarget;
  instanceConnectionName: string;
  databaseName: string;
  user: string;
  password: string;
  projectId: string;
};

const instancePattern = /^[a-z][a-z0-9-]{4,28}[a-z0-9]:[a-z][a-z0-9-]{0,40}:[a-z][a-z0-9-]{0,97}$/;

export function parseMissionProductionConfig(env: Record<string, string | undefined>): MissionProductionConfig {
  const target = env.MISSION_RELEASE_TARGET;
  const instanceConnectionName = env.MISSION_DB_INSTANCE?.trim();
  const databaseName = env.MISSION_DB_NAME?.trim();
  const user = env.MISSION_DB_USER?.trim();
  const password = env.MISSION_DB_PASSWORD;
  const firebaseProject = env.FIREBASE_PROJECT_ID?.trim();
  const cloudProject = env.GOOGLE_CLOUD_PROJECT?.trim();
  const projectId = firebaseProject || cloudProject;
  const valid = (target === "staging" || target === "production")
    && !!instanceConnectionName && instancePattern.test(instanceConnectionName)
    && !!databaseName && databaseName.length <= 63 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)
    && !!user && user.length <= 63 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(user)
    && typeof password === "string" && password.length >= 8 && password.length <= 200
    && !!projectId && projectId.length >= 3 && projectId.length <= 128 && !projectId.startsWith("demo-")
    && (!firebaseProject || !cloudProject || firebaseProject === cloudProject);
  if (!valid) throw new Error(missionDatabaseUnavailable);
  return { target, instanceConnectionName: instanceConnectionName!, databaseName: databaseName!, user: user!, password, projectId: projectId! };
}
