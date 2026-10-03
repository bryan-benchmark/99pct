import { productionWorkspaceDb } from "../src/workspace/db/client";

async function main() {
  const db = productionWorkspaceDb(process.env.WORKSPACE_MAINTENANCE_DATABASE_URL || process.env.DATABASE_URL);
  try {
    const result = await db.query<{ deleted: number }>(
      "WITH removed AS (DELETE FROM workspace_rate_limits WHERE window_start < now() - interval '2 days' RETURNING 1) SELECT count(*)::int AS deleted FROM removed",
    );
    process.stdout.write(`Pruned ${result.rows[0]?.deleted || 0} expired workspace rate-limit windows.\n`);
  } finally { await db.close(); }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Rate-limit pruning failed."}\n`);
  process.exitCode = 1;
});
