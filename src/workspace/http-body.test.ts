import assert from "node:assert/strict";
import { test } from "node:test";
import { readWorkspaceJsonObject } from "./http-body";

test("workspace JSON reader rejects oversized streaming input before consuming the rest", async () => {
  let reads = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      reads++;
      controller.enqueue(new Uint8Array(64));
    },
  });
  const result = await readWorkspaceJsonObject(new Request("http://localhost/write", { method: "POST", body, duplex: "half" } as RequestInit), 100);
  assert.equal(result.error?.status, 413);
  assert.equal(reads, 2);
});

test("workspace JSON reader rejects claimed oversize and malformed or nonobject input", async () => {
  const oversized = await readWorkspaceJsonObject(new Request("http://localhost/write", { method: "POST", body: "{}", headers: { "content-length": "999" } }), 10);
  assert.equal(oversized.error?.status, 413);
  for (const input of ["null", "[]", "{", "\"value\""]) {
    const result = await readWorkspaceJsonObject(new Request("http://localhost/write", { method: "POST", body: input }), 100);
    assert.equal(result.error?.status, 400);
  }
  const valid = await readWorkspaceJsonObject(new Request("http://localhost/write", { method: "POST", body: '{"name":"ok"}' }), 100);
  assert.deepEqual(valid.body, { name: "ok" });
});
