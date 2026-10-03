/**
 * Mechanical guard: surface “What is Missionism?” copy must use the locked definition.
 * See docs/proposals/MISSIONISM_COMMUNICATION.md — Definition discipline.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeHero } from "./home";
import { whyNowMeta } from "./whyNow";
import { longDefinition, shortDefinition } from "./voice";

describe("Missionism definition discipline", () => {
  it("locks a single public short definition", () => {
    assert.match(shortDefinition, /^Missionism is a better way to organize work\./);
    assert.doesNotMatch(shortDefinition, /movement|ideology|philosophy|socialism|capitalism/i);
  });

  it("homepage hero uses shortDefinition verbatim", () => {
    assert.equal(homeHero.definition, shortDefinition);
  });

  it("why-now lede begins from shortDefinition (no competing category lead)", () => {
    assert.ok(whyNowMeta.lede.startsWith(shortDefinition));
  });

  it("longDefinition stays an operating-system elaboration, not a rival category", () => {
    assert.match(longDefinition, /open operating system for organizations/);
    assert.doesNotMatch(longDefinition, /movement|ideology|political/i);
  });
});
