import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseToolAction } from "./model";
import { applyToolAction, getToolshareSnapshot, ToolshareError } from "./store";

const actorA = "d94ef099-7b74-49b1-8473-ed4e65facdb2";
const actorB = "451d7197-9d94-4ccb-ab35-a37669c3711a";

test("validates the small event vocabulary", () => {
  assert.deepEqual(parseToolAction({ type: "reserve", toolId: "drill" }), { type: "reserve", toolId: "drill" });
  assert.throws(() => parseToolAction({ type: "reserve", toolId: "unknown" }), /valid action/);
  assert.throws(() => parseToolAction({ type: "report_issue", reservationId: actorA, issueCode: "broken_forever" }), /valid action/);
});

test("concurrent reservations, ownership, return, and issue quarantine", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-toolshare-test-"));
  const previous = process.env.MISSION_TOOLSHARE_DATA_DIR;
  process.env.MISSION_TOOLSHARE_DATA_DIR = directory;
  try {
    const attempts = await Promise.allSettled([
      applyToolAction(actorA, { type: "reserve", toolId: "drill" }),
      applyToolAction(actorB, { type: "reserve", toolId: "drill" }),
    ]);
    assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal((await getToolshareSnapshot()).inventory.find((item) => item.id === "drill")?.status, "reserved");
    const owner = (await getToolshareSnapshot(actorA)).myReservations.length ? actorA : actorB;
    const other = owner === actorA ? actorB : actorA;
    const reservationId = (await getToolshareSnapshot(owner)).myReservations[0].id;
    await assert.rejects(applyToolAction(other, { type: "check_out", reservationId }), (error) => error instanceof ToolshareError && error.status === 404);

    await applyToolAction(owner, { type: "check_out", reservationId });
    assert.equal((await getToolshareSnapshot()).inventory.find((item) => item.id === "drill")?.status, "out");
    await applyToolAction(owner, { type: "report_issue", reservationId, issueCode: "unsafe" });
    await assert.rejects(applyToolAction(owner, { type: "report_issue", reservationId, issueCode: "damaged" }), /only be reported once/);
    await applyToolAction(owner, { type: "return", reservationId });
    const snapshot = await getToolshareSnapshot(owner);
    assert.equal(snapshot.inventory.find((item) => item.id === "drill")?.status, "needs_review");
    assert.deepEqual(snapshot.metrics, { requests: 1, completedLoans: 1, issues: 1 });
    await assert.rejects(applyToolAction(other, { type: "reserve", toolId: "drill" }), /unavailable/);

    const washer = await applyToolAction(other, { type: "reserve", toolId: "washer" });
    await applyToolAction(other, { type: "cancel", reservationId: washer.reservationId });
    assert.equal((await getToolshareSnapshot()).inventory.find((item) => item.id === "washer")?.status, "available");

    const eventFiles = (await readdir(directory)).filter((name) => /^\d{8}\.json$/.test(name)).sort();
    assert.equal(eventFiles.length, 6);
    const first = JSON.parse(await readFile(path.join(directory, eventFiles[0]), "utf8"));
    assert.equal(first.schemaVersion, 1);
    assert.equal(first.missionId, "toolshare-demo");
    assert.equal(first.type, "tool.reserved");
  } finally {
    if (previous === undefined) delete process.env.MISSION_TOOLSHARE_DATA_DIR;
    else process.env.MISSION_TOOLSHARE_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
