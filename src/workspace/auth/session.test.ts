import assert from "node:assert/strict";
import test from "node:test";
import { assertVerifiedRecentLogin, validSameOriginCsrf } from "./session";

test("session exchange requires same origin and matching long CSRF secret", () => {
  const token = "a".repeat(64);
  assert.equal(validSameOriginCsrf("https://app.example.test", "https://app.example.test", token, token), true);
  assert.equal(validSameOriginCsrf("https://attacker.example", "https://app.example.test", token, token), false);
  assert.equal(validSameOriginCsrf("https://app.example.test", "https://app.example.test", token, "b".repeat(64)), false);
  assert.equal(validSameOriginCsrf("https://app.example.test", "https://app.example.test", "short", "short"), false);
});

test("session exchange requires verified email and recent authentication", () => {
  const now = 2_000_000_000;
  assert.doesNotThrow(() => assertVerifiedRecentLogin({ email: "a@example.test", email_verified: true, auth_time: now - 60 }, now));
  assert.throws(() => assertVerifiedRecentLogin({ email: "a@example.test", email_verified: false, auth_time: now - 60 }, now));
  assert.throws(() => assertVerifiedRecentLogin({ email: "a@example.test", email_verified: true, auth_time: now - 400 }, now));
  assert.throws(() => assertVerifiedRecentLogin({ email: "a@example.test", email_verified: true, auth_time: now + 120 }, now));
});
