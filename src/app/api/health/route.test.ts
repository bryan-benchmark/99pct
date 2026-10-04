import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("GET /api/health reports application readiness without infrastructure details", async () => {
  const response = await GET();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(body, { status: "ready", service: "99pct" });
  const serialized = JSON.stringify({
    status: response.status,
    headers: [...response.headers.entries()],
    body,
  });
  assert.equal(/postgres|secret|firebase|serviceAccount|password|token/i.test(serialized), false);
});
