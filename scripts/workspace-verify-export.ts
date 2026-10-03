import { readFile } from "node:fs/promises";
import { verifyOrganizationExport } from "../src/workspace/export-verification";

async function main() {
  const filename = process.argv[2];
  if (!filename || process.argv.length !== 3) throw new Error("Usage: npm run workspace:verify-export -- <downloaded-export.json>");
  const record: unknown = JSON.parse(await readFile(filename, "utf8"));
  const result = verifyOrganizationExport(record);
  process.stdout.write(`Export checks passed for organization ${result.organizationId}: ${result.members} members, ${result.decisions} decisions, ${result.events} ordered events. The checksum does not prove who created the file.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Export check failed."}\n`);
  process.exitCode = 1;
});
