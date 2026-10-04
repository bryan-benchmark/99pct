/**
 * Mechanical guard: surface “What is Missionism?” copy must use the locked definition.
 * See docs/proposals/MISSIONISM_COMMUNICATION.md — Definition discipline.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { whyNowMeta } from "./whyNow";
import { longDefinition, shortDefinition } from "./voice";

describe("Missionism definition discipline", () => {
  it("locks a single public short definition", () => {
    assert.match(shortDefinition, /^Missionism is a better way to organize work\./);
    assert.doesNotMatch(shortDefinition, /movement|ideology|philosophy|socialism|capitalism/i);
  });

  it("the Missionism hub uses shortDefinition verbatim", () => {
    const page = readFileSync(new URL("../app/missionism/page.tsx", import.meta.url), "utf8");
    assert.match(page, /shortDefinition/);
    assert.equal(page.includes("<h1>Missionism</h1>") || page.includes("missionismHubCopy.title"), true);
  });

  it("why-now lede begins from shortDefinition (no competing category lead)", () => {
    assert.ok(whyNowMeta.lede.startsWith(shortDefinition));
  });

  it("longDefinition stays an operating-system elaboration, not a rival category", () => {
    assert.match(longDefinition, /open operating system for organizations/);
    assert.doesNotMatch(longDefinition, /movement|ideology|political/i);
  });
});
