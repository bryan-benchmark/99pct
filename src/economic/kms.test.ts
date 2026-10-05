import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { cloudKmsSigner, plannedKmsKeyVersion } from "./checkpoint/kms";

const keyVersion = plannedKmsKeyVersion();

function response(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

test("the Cloud KMS signer uses the approved key and verifies the raw Ed25519 signature", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    if (url.endsWith("/publicKey")) return response({ pem, algorithm: "EC_SIGN_ED25519" });
    const data = JSON.parse(String(init?.body)) as { data: string };
    const raw = Buffer.from(data.data, "base64");
    return response({ name: keyVersion, signature: sign(null, raw, privateKey).toString("base64") });
  }) as typeof fetch;
  const signer = await cloudKmsSigner({
    auth: { getAccessToken: async () => "token" },
    fetchImpl,
  });
  const signature = await signer.sign("economic-checkpoint");
  assert.equal(typeof signature, "string");
  assert.equal(signer.signerRef, keyVersion);
});

test("the Cloud KMS signer refuses a different algorithm or key", async () => {
  const fetchImpl = (async () => response({ pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA\n-----END PUBLIC KEY-----\n", algorithm: "EC_SIGN_P256" })) as typeof fetch;
  await assert.rejects(() => cloudKmsSigner({ auth: { getAccessToken: async () => "token" }, fetchImpl }), /Ed25519/);
  await assert.rejects(() => cloudKmsSigner({
    keyVersionName: "projects/pct-99/locations/us-central1/keyRings/economy-checkpoints/cryptoKeys/other/cryptoKeyVersions/1",
    auth: { getAccessToken: async () => "token" },
    fetchImpl,
  }), /planned ledger key/);
});

test("App Hosting does not receive economic or signing secrets", () => {
  const source = readFileSync(new URL("../../apphosting.yaml", import.meta.url), "utf8");
  for (const name of ["economy-kernel-writer-password", "economy-recognition-submitter-password", "economy-governance-submitter-password", "economy-bounty-recognition-submitter-password", "economy-verifier-password", "cloudkms"]) {
    assert.equal(source.includes(name), false, name);
  }
});
