import { readFileSync } from "node:fs";
import { verifyExport } from "../src/economic/verify/verify";

const file = process.argv[2];
if (!file) {
  process.stderr.write("Usage: npm run economy:verify -- <export-file>\n");
  process.exit(1);
}
const result = verifyExport(readFileSync(file, "utf8"));
if (!result.ok) {
  process.stderr.write(`${result.errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("economic export verified\n");
