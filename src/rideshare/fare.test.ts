import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fareCents, formatFare, splitFare } from "./fare";

test("an outside owner takes nothing from a fare", () => {
  for (let cents = 0; cents <= 10_000; cents += 1) {
    const split = splitFare(cents);
    assert.equal(split.outside, 0);
    assert.equal(split.driver + split.infrastructure + split.outside, cents);
    assert.equal(split.infrastructure, Math.floor(cents / 100));
    assert.equal(split.driver >= split.infrastructure, true);
  }
  assert.deepEqual(splitFare(1200), { fare: 1200, driver: 1188, infrastructure: 12, outside: 0 });
  assert.deepEqual(splitFare(100), { fare: 100, driver: 99, infrastructure: 1, outside: 0 });
  assert.equal(formatFare(1188), "$11.88");
  assert.equal(formatFare(12), "$0.12");
  assert.equal(formatFare(0), "$0.00");
});

test("a fare is dollars and cents, nothing else", () => {
  assert.equal(fareCents("12.00"), 1200);
  assert.equal(fareCents("12"), 1200);
  assert.equal(fareCents("12.5"), 1250);
  assert.equal(fareCents("0"), 0);
  assert.equal(fareCents("1000"), 100_000);
  assert.equal(fareCents(""), null);
  assert.equal(fareCents("12.999"), null);
  assert.equal(fareCents("$12"), null);
  assert.equal(fareCents("-1"), null);
  assert.equal(fareCents("1000.01"), null);
  assert.throws(() => splitFare(1.5), /whole number of cents/);
  assert.throws(() => splitFare(-1), /whole number of cents/);
});

test("the rideshare page shows who keeps the fare", () => {
  const page = readFileSync(new URL("../app/use/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /RideFare/);
  assert.match(page, /Rideshare 99/);
  assert.equal(page.includes("equity"), false);
});
