import { checkWorkspaceAuditIntegrity } from "../src/workspace/audit-integrity";
import { productionWorkspaceDb } from "../src/workspace/db/client";

async function main() {
  const db = productionWorkspaceDb();
  try {
    const report = await checkWorkspaceAuditIntegrity(db);
    process.stdout.write(`Checked ${report.eventsChecked} audit events across ${report.organizationsChecked} organizations.\n`);
    if (report.issues.length) {
      for (const issue of report.issues.slice(0, 20)) process.stderr.write(`${issue}\n`);
      if (report.issues.length > 20) process.stderr.write(`${report.issues.length - 20} more issues omitted.\n`);
      process.exitCode = 1;
    }
  } finally { await db.close(); }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Workspace audit check failed."}\n`);
  process.exitCode = 1;
});
