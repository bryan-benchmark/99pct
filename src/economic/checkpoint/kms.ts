import { GoogleAuth } from "google-auth-library";
import { createPublicKey, verify } from "node:crypto";
import { plannedCheckpointKms } from "./checkpoint";

type TokenSource = { getAccessToken(): Promise<string | null | undefined> };

export function plannedKmsKeyVersion() {
  const { project, location, keyRing, key } = plannedCheckpointKms;
  return `projects/${project}/locations/${location}/keyRings/${keyRing}/cryptoKeys/${key}/cryptoKeyVersions/1`;
}

export async function cloudKmsSigner(options?: { keyVersionName?: string; auth?: TokenSource; fetchImpl?: typeof fetch }) {
  const keyVersionName = options?.keyVersionName ?? plannedKmsKeyVersion();
  if (!keyVersionName.endsWith("/cryptoKeyVersions/1")) throw new Error("Checkpoint signer key version is not the planned key.");
  if (!keyVersionName.includes("/cryptoKeys/economy-ledger/")) throw new Error("Checkpoint signer key does not match the planned ledger key.");
  const auth = options?.auth ?? new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const fetchImpl = options?.fetchImpl ?? fetch;
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Cloud KMS authentication failed.");
  const published = await fetchImpl(`https://cloudkms.googleapis.com/v1/${keyVersionName}:getPublicKey`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!published.ok) throw new Error("Cloud KMS public key is unavailable.");
  const body = await published.json() as { pem?: string; algorithm?: string };
  if (body.algorithm !== "EC_SIGN_ED25519" || !body.pem?.includes("BEGIN PUBLIC KEY")) {
    throw new Error("Cloud KMS key is not the approved Ed25519 signer.");
  }
  const publicKeyPem = body.pem;
  return {
    signerRef: keyVersionName,
    publicKeyPem,
    async sign(message: string) {
      const fresh = await auth.getAccessToken();
      if (!fresh) throw new Error("Cloud KMS authentication failed.");
      const response = await fetchImpl(`https://cloudkms.googleapis.com/v1/${keyVersionName}:asymmetricSign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${fresh}`, "Content-Type": "application/json" },
        body: JSON.stringify({ data: Buffer.from(message, "utf8").toString("base64") }),
      });
      if (!response.ok) throw new Error("Cloud KMS signing failed.");
      const signed = await response.json() as { signature?: string; name?: string };
      if (!signed.signature || signed.name !== keyVersionName) throw new Error("Cloud KMS returned an unexpected signature.");
      const signature = signed.signature;
      const verified = verify(null, Buffer.from(message, "utf8"), createPublicKey(publicKeyPem), Buffer.from(signature, "base64"));
      if (!verified) throw new Error("Cloud KMS signature did not verify.");
      return signature;
    },
  };
}
