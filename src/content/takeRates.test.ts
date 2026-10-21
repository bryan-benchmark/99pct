import assert from "node:assert/strict";
import test from "node:test";
import { heroIncumbents } from "@/content/utilities";
import { estimateShare, takeEstimates } from "./takeRates";
import { splitFare } from "@/rideshare/fare";

test("every logo has a rounded estimate, and the 99% column keeps the rule", () => {
  for (const name of heroIncumbents) {
    const estimate = takeEstimates[name];
    assert.ok(estimate, name);
    assert.equal(estimate.work + estimate.infrastructure + estimate.corporate, 100, name);
    assert.equal(estimate.work >= 0 && estimate.infrastructure >= 0 && estimate.corporate >= 0, true, name);
    const them = estimateShare(estimate.cents, estimate.work, estimate.infrastructure);
    assert.equal(them.workCents + them.infrastructureCents + them.corporateCents, estimate.cents, name);
    assert.equal(them.corporateCents >= 0, true, name);
    const ours = splitFare(estimate.cents);
    assert.equal(ours.outside, 0, name);
    assert.equal(ours.driver + ours.infrastructure, estimate.cents, name);
  }
});
