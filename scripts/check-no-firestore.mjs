import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const marker = ["fire", "store"].join("");
const importPattern = new RegExp(
  String.raw`(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"][^'"]*${marker}`,
);

const ROOTS = ["src", "scripts"];
const SKIP = new Set(["scripts/check-no-firestore.mjs", "scripts/check-npm-audit.mjs", "scripts/check-npm-audit.test.mjs"]);

export function firestoreImportLines(text) {
  return text.split("\n").flatMap((line, index) => (importPattern.test(line) ? [index + 1] : []));
}

function walk(dir, files) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path, files);
      continue;
    }
    if (/\.(ts|tsx|js|mjs|cjs)$/.test(name)) files.push(path);
  }
}

export function findFirestoreImports(root = process.cwd()) {
  const files = [];
  for (const dir of ROOTS) walk(join(root, dir), files);
  const hits = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (SKIP.has(rel)) continue;
    for (const line of firestoreImportLines(readFileSync(file, "utf8"))) {
      hits.push(`${rel}:${line}`);
    }
  }
  return hits;
}

export function assertNoFirestoreImports(root = process.cwd()) {
  const hits = findFirestoreImports(root);
  if (hits.length > 0) {
    throw new Error(`Firestore import found while the gRPC exception is active:\n${hits.join("\n")}`);
  }
}
