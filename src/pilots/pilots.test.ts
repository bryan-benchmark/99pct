import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createSpark } from "@/sparks/store";
import { parseDraft } from "@/sparks/types";
import { createPilotPlan, getPilotPlan } from "./store";
import { parsePilotDraft } from "./types";

const pilot = {
  scope: "Share two tools among five households for one week",
  steward: "Neighborhood pilot team",
  endDate: "2099-12-31",
  economicMode: "utility",
  fundingSource: "Prospective member fees",
  resourceLimit: "Up to $200 and ten volunteer hours",
  successMeasure: "Five completed loans with no missing tools",
  humanGuardrail: "Nobody spends more than one hour coordinating",
  safetyGuardrail: "Inspect tools before every loan",
  participantNotice: "Households choose to join after reading the loan rules",
  stopRule: "Stop after any injury or missing tool",
};

test("pilot gate rejects incomplete plans, invalid modes, and expired dates", () => {
  assert.equal(parsePilotDraft(pilot, "2026-09-27").scope, pilot.scope);
  assert.throws(() => parsePilotDraft({ ...pilot, steward: "" }, "2026-09-27"), /steward/);
  assert.throws(() => parsePilotDraft({ ...pilot, economicMode: "infinite" }, "2026-09-27"), /economic mode/);
  assert.throws(() => parsePilotDraft({ ...pilot, endDate: "2026-09-27" }, "2026-09-27"), /after today/);
  assert.throws(() => parsePilotDraft({ ...pilot, endDate: "2099-02-30" }, "2026-09-27"), /after today/);
});

test("candidate plans persist only for existing Sparks", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-pilot-test-"));
  const previous = process.env.MISSION_SPARK_DATA_DIR;
  process.env.MISSION_SPARK_DATA_DIR = directory;
  try {
    const spark = await createSpark(parseDraft({
      wish: "Share household tools",
      name: "Toolshare",
      people: "Nearby households",
      place: "Decatur",
      pilot: "Share two tools for one week",
      evidence: "Five successful loans",
      inputs: ["demand"],
    }));
    const plan = await createPilotPlan(spark.id, parsePilotDraft(pilot, "2026-09-27"));
    assert.ok(plan);
    assert.equal(plan.status, "candidate_for_review");
    assert.deepEqual(await getPilotPlan(spark.id, plan.id), plan);
    assert.equal(await getPilotPlan(spark.id, "../proposal.json"), null);
    assert.equal(await createPilotPlan("missing", parsePilotDraft(pilot, "2026-09-27")), null);
  } finally {
    if (previous === undefined) delete process.env.MISSION_SPARK_DATA_DIR;
    else process.env.MISSION_SPARK_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
