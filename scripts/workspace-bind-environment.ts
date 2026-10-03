import { productionWorkspaceDb } from "../src/workspace/db/client";
import { bindWorkspaceEnvironment, parseWorkspaceReleaseTarget } from "../src/workspace/environment";

async function main() {
  const target = parseWorkspaceReleaseTarget(process.env.WORKSPACE_RELEASE_TARGET);
  const databaseName = process.env.WORKSPACE_EXPECTED_DATABASE_NAME;
  const firebaseProjectId = process.env.WORKSPACE_EXPECTED_FIREBASE_PROJECT_ID;
  const connection = process.env.WORKSPACE_MIGRATION_DATABASE_URL;
  if (!databaseName || !firebaseProjectId || !connection) throw new Error("WORKSPACE_EXPECTED_DATABASE_NAME, WORKSPACE_EXPECTED_FIREBASE_PROJECT_ID, and WORKSPACE_MIGRATION_DATABASE_URL are required.");
  const db = productionWorkspaceDb(connection);
  try {
    const result = await bindWorkspaceEnvironment(db, target, databaseName, firebaseProjectId);
    process.stdout.write(`Workspace database ${JSON.stringify(databaseName)} is bound to ${target} and Firebase project ${JSON.stringify(firebaseProjectId)}${result.alreadyBound ? " (already bound)" : ""}.\n`);
  } finally { await db.close(); }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Workspace environment binding failed."}\n`);
  process.exitCode = 1;
});
