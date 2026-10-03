import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { addInterest, createSpark, getInterest, getInterestCounts, getSpark } from "./store";
import { parseDraft, parseInputs } from "./types";

const draft = {
  wish: "I wish my neighborhood had shared tools.",
  name: "Toolshare Decatur",
  people: "Nearby households",
  place: "Decatur, Georgia",
  pilot: "Share five tools for one month",
  evidence: "Fifteen completed loans with costs covered",
  inputs: ["demand", "assets"],
};

test("validates proposals and interest categories", () => {
  assert.equal(parseDraft(draft).name, draft.name);
  assert.throws(() => parseDraft({ ...draft, wish: " " }), /wish/);
  assert.throws(() => parseDraft({ ...draft, name: "x".repeat(81) }), /name/);
  assert.throws(() => parseInputs(["demand", "demand"], true), /only once/);
  assert.throws(() => parseInputs([], true), /at least one/);
});

test("persists a proposal and counts one response per browser", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-spark-test-"));
  const previous = process.env.MISSION_SPARK_DATA_DIR;
  process.env.MISSION_SPARK_DATA_DIR = directory;
  try {
    const spark = await createSpark(parseDraft(draft));
    assert.deepEqual(await getSpark(spark.id), spark);
    assert.equal(await getSpark("../another-file"), null);

    const browserA = "fc20dd77-79cc-4f14-a4ec-a4a280b283fa";
    const browserB = "14547fa8-d0c5-4f06-b619-45d4d8630a3c";
    assert.equal(await addInterest(spark.id, browserA, ["demand", "assets"]), "added");
    assert.equal(await addInterest(spark.id, browserA, ["money"]), "duplicate");
    assert.equal(await addInterest(spark.id, browserB, ["demand"]), "added");
    assert.deepEqual((await getInterest(spark.id, browserA))?.inputs, ["demand", "assets"]);
    assert.deepEqual(await getInterestCounts(spark.id), {
      responses: 2,
      counts: { demand: 2, money: 0, work: 0, skills: 0, assets: 1, space: 0 },
    });
    const saved = await readFile(path.join(directory, spark.id, "proposal.json"), "utf8");
    assert.match(saved, /Toolshare Decatur/);
  } finally {
    if (previous === undefined) delete process.env.MISSION_SPARK_DATA_DIR;
    else process.env.MISSION_SPARK_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
