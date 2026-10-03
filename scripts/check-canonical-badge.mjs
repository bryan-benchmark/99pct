#!/usr/bin/env node
/**
 * Fails if:
 * 1. A CANONICAL maturity badge is rendered outside CanonicalClaim.
 * 2. claim( / humanConstraint( are imported for UI outside CanonicalClaim
 *    (side entrance into canonical.json).
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filename);
    return entry.isFile() && /\.(?:[jt]sx?)$/.test(filename) ? [filename] : [];
  });
}

function findLines(pattern, excludedNames = []) {
  const hits = [];
  for (const filename of sourceFiles(path.join(root, "src"))) {
    if (excludedNames.includes(path.basename(filename))) continue;
    const lines = readFileSync(filename, "utf8").split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      if (pattern.test(lines[index])) hits.push(`${path.relative(root, filename)}:${index + 1}:${lines[index]}`);
    }
  }
  return hits.join("\n");
}

const badgeHits = findLines(/level=["']canonical["']/, ["CanonicalClaim.tsx"]);

if (badgeHits) {
  console.error(
    "Canonical badge must only be rendered inside CanonicalClaim.tsx:\n" +
      badgeHits,
  );
  process.exit(1);
}

const sideEntrance = findLines(/\b(?:claim|humanConstraint)\(/, ["CanonicalClaim.tsx", "canonical.ts"]);

if (sideEntrance) {
  console.error(
    "Canonical text must reach UI only via CanonicalClaim (no claim()/humanConstraint() side entrance):\n" +
      sideEntrance,
  );
  process.exit(1);
}

console.log("check-canonical-badge: ok");
