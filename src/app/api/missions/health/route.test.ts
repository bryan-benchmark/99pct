import assert from "node:assert/strict";
import test from "node:test";
import { GET, missionHealthResponse } from "./route";

test("Mission health is ready only for a checked database and stays minimal", async () => {
  const ready = await missionHealthResponse(async () => undefined);
  const readyBody = await ready.json();
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(readyBody, { status: "ready" });

  const unavailable = await missionHealthResponse(async () => {
    throw new Error("password=runtime-secret instance pct-99 database missions");
  });
  const unavailableBody = await unavailable.json();
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(unavailableBody, { status: "unavailable" });
  const serialized = JSON.stringify({ status: unavailable.status, headers: [...unavailable.headers.entries()], body: unavailableBody });
  assert.equal(/password|secret|pct-99|missions|postgres|instance/i.test(serialized), false);
});

test("Mission health fails closed when production binding is absent", async () => {
  const response = await GET();
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(body, { status: "unavailable" });
});
