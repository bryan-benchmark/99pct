import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { DELETE, POST } from "../../app/api/human/session/route";
import { assertVerifiedRecentHumanLogin, humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName, safeReturnPath } from "./session";
import { csrfCookieName, sessionCookieName } from "../../workspace/auth/session";
import { verifyHumanSession } from "./server";

test("the public human session is distinct from the workspace session", () => {
  assert.notEqual(humanSessionCookieName, sessionCookieName);
  assert.notEqual(humanCsrfCookieName, csrfCookieName);
  assert.equal(safeReturnPath("/missions/new"), "/missions/new");
  assert.equal(safeReturnPath("https://attacker.example"), "/missions");
});

test("an unverified identity cannot establish a human session", () => {
  const now = 2_000_000_000;
  assert.throws(() => assertVerifiedRecentHumanLogin({ email: "a@example.test", email_verified: false, auth_time: now - 30 }, now), /Verify your email/);
  assert.throws(() => assertVerifiedRecentHumanLogin({ email: "a@example.test", email_verified: true, auth_time: now - 400 }, now), /Sign in again/);
});

test("a malformed or unverified session is treated as signed out", async () => {
  const malformed = await verifyHumanSession("not-a-session", {
    verifySessionCookie: async () => {
      throw Object.assign(new Error("bad"), { code: "auth/argument-error" });
    },
  });
  const unverified = await verifyHumanSession("cookie", {
    verifySessionCookie: async () => ({ email: "a@example.test", email_verified: false, uid: "uid-1" }) as never,
  });
  assert.equal(malformed, null);
  assert.equal(unverified, null);
});

test("human session mutation rejects a cross-origin or invalid CSRF request", async () => {
  const token = "d".repeat(64);
  const url = "http://localhost:3000/api/human/session";
  const headers = { "content-type": "application/json", origin: "https://attacker.example", cookie: `human_csrf=${token}` };
  const created = await POST(new NextRequest(url, { method: "POST", headers, body: JSON.stringify({ csrfToken: token, idToken: "x" }) }));
  const removed = await DELETE(new NextRequest(url, { method: "DELETE", headers, body: JSON.stringify({ csrfToken: "other" }) }));
  assert.equal(created.status, 403);
  assert.equal(removed.status, 403);
  const internal = "https://pct99-494723962533.us-central1.run.app";
  assert.equal(humanCsrfAccepted("https://pct99--pct-99.us-central1.hosted.app", internal, token, token), true);
  assert.equal(humanCsrfAccepted("https://attacker.example", internal, token, token), false);
  assert.equal(humanCsrfAccepted("http://localhost:3000", "http://localhost:3000", token, token), true);
});
