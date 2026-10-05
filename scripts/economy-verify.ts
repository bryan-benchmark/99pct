import { readFileSync } from "node:fs";
import type { SignedCheckpoint } from "../src/economic/checkpoint/checkpoint";
import { verifyAnchoredExport, verifyExport } from "../src/economic/verify/verify";

function checkpointArgs(file: string): [SignedCheckpoint, string] {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { signed: SignedCheckpoint; publicKeyPem: string };
  return [parsed.signed, parsed.publicKeyPem];
}

const file = process.argv[2];
if (!file) {
  process.stderr.write("Usage: npm run economy:verify -- <export-file> [checkpoint-file]\n");
  process.exit(1);
}
const contents = readFileSync(file, "utf8");
const checkpointFile = process.argv[3];
const result = checkpointFile
  ? verifyAnchoredExport(contents, ...checkpointArgs(checkpointFile))
  : verifyExport(contents);
if (!result.ok) {
  process.stderr.write(`${result.errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("economic export verified\n");
