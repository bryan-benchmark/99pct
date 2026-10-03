import assert from "node:assert/strict";
import test from "node:test";
import { isInvalidWorkspaceCredential, verifyWorkspaceSession } from "./server";

test("expired and revoked credentials are distinct from identity-service failures", async () => {
  for (const code of ["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/user-disabled"]) {
    assert.equal(isInvalidWorkspaceCredential({ code }, "id_token"), true);
  }
  for (const code of ["auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/argument-error"]) {
    assert.equal(isInvalidWorkspaceCredential({ code }, "session"), true);
  }
  for (const code of ["auth/internal-error", "auth/insufficient-permission", "ECONNREFUSED"]) {
    assert.equal(isInvalidWorkspaceCredential({ code }, "id_token"), false);
    assert.equal(isInvalidWorkspaceCredential({ code }, "session"), false);
  }
  assert.equal(await verifyWorkspaceSession(undefined), null);
});
