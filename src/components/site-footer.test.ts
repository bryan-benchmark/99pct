import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SiteFooter.tsx", import.meta.url), "utf8");

test("global footer links to the public 99pct source repository", () => {
  assert.match(
    source,
    /<a href="https:\/\/github\.com\/bryan-benchmark\/99pct">Source \(AGPL-3\.0\)<\/a>/,
  );
  assert.equal(source.includes("GNU AFFERO GENERAL PUBLIC LICENSE"), false);
  assert.equal(/docs\/[\s\S]{0,80}AGPL|spec\/[\s\S]{0,80}AGPL/.test(source), false);
});
