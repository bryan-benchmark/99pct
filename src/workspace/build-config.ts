export function assertWorkspaceReleaseBuildConfig(env: Record<string, string | undefined>) {
  const target = env.WORKSPACE_RELEASE_TARGET;
  if (!target) return;
  if (target !== "staging" && target !== "production") throw new Error("Workspace build target must be staging or production.");
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!projectId || projectId.startsWith("demo-") || !apiKey || apiKey.length < 20 || apiKey === "demo-key") {
    throw new Error("Workspace release build needs a live Firebase web project and API key.");
  }
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID !== projectId) throw new Error("Workspace server and browser Firebase project IDs differ.");
  if (env.GOOGLE_CLOUD_PROJECT && env.GOOGLE_CLOUD_PROJECT !== projectId) throw new Error("Workspace cloud and browser Firebase project IDs differ.");
  if (env.FIREBASE_AUTH_EMULATOR_HOST || env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || env.WORKSPACE_DEV_DB_DIR || env.WORKSPACE_LOCAL_TEST_RUNTIME) {
    throw new Error("Workspace release builds cannot use local emulators or embedded storage.");
  }
}
