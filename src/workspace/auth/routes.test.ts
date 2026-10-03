import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST, DELETE } from "../../app/api/workspace/session/route";

test("session endpoints reject a JSON null body without a server error", async () => {
  const url = "http://localhost:3001/api/workspace/session";
  const headers = { "content-type": "application/json", origin: "http://localhost:3001" };
  const post = await POST(new NextRequest(url, { method: "POST", headers, body: "null" }));
  const deleted = await DELETE(new NextRequest(url, { method: "DELETE", headers, body: "null" }));
  assert.equal(post.status, 400);
  assert.equal(deleted.status, 403);
});
