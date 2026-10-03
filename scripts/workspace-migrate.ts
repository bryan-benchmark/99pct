import { productionWorkspaceDb } from "../src/workspace/db/client";
import { migrateWorkspace } from "../src/workspace/db/migrate";

async function main() {
  const db = productionWorkspaceDb(process.env.WORKSPACE_MIGRATION_DATABASE_URL || process.env.DATABASE_URL, { statementTimeoutMs: 300_000, idleTransactionTimeoutMs: 360_000 });
  try {
    await migrateWorkspace(db);
    process.stdout.write("Workspace migrations applied.\n");
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Workspace migration failed."}\n`);
  process.exitCode = 1;
});
