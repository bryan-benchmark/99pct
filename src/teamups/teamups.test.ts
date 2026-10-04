import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createTeamUp, getTeamUp } from "./store";
import { parseTeamUpDraft } from "./types";

const candidate = {
  purpose: "Inspect flagged tools",
  toolshareContribution: "Send tool and issue record",
  repairContribution: "Inspect and recommend disposition",
  deliverable: "Inspection record",
  toolshareAuthority: "Controls inventory",
  repairAuthority: "Controls inspection method",
  jointApproval: "Both approve paid work",
  successMeasure: "All three items receive a disposition",
  endDate: "2030-06-01",
  resourceLimit: "Three items",
  settlementPlan: "No money or MCU in demo",
  coordinationPlan: "Weekly check-in",
  stopRule: "Stop for safety concern",
};

test("requires complete terms and a real future end date", () => {
  assert.deepEqual(parseTeamUpDraft(candidate, "2029-01-01"), candidate);
  assert.throws(() => parseTeamUpDraft({ ...candidate, repairAuthority: " " }, "2029-01-01"));
  assert.throws(() => parseTeamUpDraft({ ...candidate, endDate: "2029-02-30" }, "2029-01-01"));
  assert.throws(() => parseTeamUpDraft({ ...candidate, endDate: "2029-01-01" }, "2029-01-01"));
});

test("saved candidate keeps separate Mission identity and creates no approval", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-teamup-test-"));
  process.env.MISSION_TEAMUP_DATA_DIR = directory;
  try {
    const saved = await createTeamUp(parseTeamUpDraft(candidate, "2029-01-01"));
    assert.equal(saved.status, "candidate_for_review");
    assert.deepEqual(saved.missionIds, ["toolshare-demo", "repair-demo"]);
    assert.deepEqual(await getTeamUp(saved.id), saved);
    assert.equal(await getTeamUp("../invalid"), null);
  } finally {
    delete process.env.MISSION_TEAMUP_DATA_DIR;
    await rm(directory, { recursive: true, force: true });
  }
});
