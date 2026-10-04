import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createExperiment, getExperiment } from "./store";
import { parseExperimentDraft } from "./types";

const candidate = {
  hypothesis: "A prompt improves issue detail",
  intervention: "Show a checklist",
  comparison: "Current prompt",
  exposureClass: "interface_only",
  primaryOutcome: "Triage-ready reports",
  humanGuardrail: "Urgent reporting remains available",
  consentPlan: "Opt-in usability participants",
  stopRule: "Stop if urgent reports are delayed",
  evidencePlan: "Record rubric and task results",
  endDate: "2030-06-01",
  adoptionRule: "Steward reviews evidence separately",
};

test("requires design, protection, evidence, valid exposure and future date", () => {
  assert.deepEqual(parseExperimentDraft(candidate, "2029-01-01"), candidate);
  assert.throws(() => parseExperimentDraft({ ...candidate, evidencePlan: " " }, "2029-01-01"));
  assert.throws(() => parseExperimentDraft({ ...candidate, exposureClass: "automatic" }, "2029-01-01"));
  assert.throws(() => parseExperimentDraft({ ...candidate, endDate: "2029-02-30" }, "2029-01-01"));
});

test("saved design remains a proposal with no execution status", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-experiment-test-"));
  process.env.MISSION_EXPERIMENT_DATA_DIR = directory;
  try {
    const saved = await createExperiment(parseExperimentDraft(candidate, "2029-01-01"));
    assert.equal(saved.status, "proposed_for_review");
    assert.equal(saved.missionId, "toolshare-demo");
    assert.deepEqual(await getExperiment(saved.id), saved);
    assert.equal(await getExperiment("../invalid"), null);
  } finally {
    delete process.env.MISSION_EXPERIMENT_DATA_DIR;
    await rm(directory, { recursive: true, force: true });
  }
});
