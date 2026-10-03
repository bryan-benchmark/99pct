import assert from "node:assert/strict";
import test from "node:test";
import { workspaceApiError } from "./http-errors";
import { WorkspaceError } from "./organizations";

test("unexpected workspace failures have a traceable redacted log and response", async () => {
  const lines: string[] = [];
  const previous = console.error;
  console.error = (line: unknown) => { lines.push(String(line)); };
  try {
    const failure = Object.assign(new Error("postgresql://secret-user:secret-password@host/customer?email=private@example.test"), { code: "23505" });
    const response = workspaceApiError(failure, "contracts.save");
    const body = await response.json() as { error: string; requestId: string };
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Request-ID"), body.requestId);
    assert.match(body.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(body.error.includes(body.requestId), true);
    assert.equal(lines.length, 1);
    const log = JSON.parse(lines[0]) as { component: string; operation: string; requestId: string; code: string };
    assert.deepEqual(log, { component: "workspace", operation: "contracts.save", status: 503, requestId: body.requestId, code: "23505" });
    assert.equal(JSON.stringify({ body, lines }).includes("secret-password"), false);
    assert.equal(JSON.stringify({ body, lines }).includes("private@example.test"), false);
  } finally { console.error = previous; }
});

test("expected business denials retain their status without an incident log", async () => {
  const lines: string[] = [];
  const previous = console.error;
  console.error = (line: unknown) => { lines.push(String(line)); };
  try {
    const response = workspaceApiError(new WorkspaceError(409, "The decision changed. Reload before saving."), "decisions.revise");
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "The decision changed. Reload before saving." });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(lines, []);
  } finally { console.error = previous; }
});
