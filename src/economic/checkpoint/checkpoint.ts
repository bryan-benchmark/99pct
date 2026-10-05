import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { canonicalize } from "../canonical";
import { verifyChain } from "../chain";
import type { EconomicEvent } from "../model";

export const checkpointFormat = "economic-checkpoint-v1";

export type EconomicCheckpoint = {
  format: typeof checkpointFormat;
  missionId: string;
  lastSequence: string;
  lastEventHash: string;
  eventCount: string;
  checkpointAt: string;
  signerRef: string;
};

export type SignedCheckpoint = {
  checkpoint: EconomicCheckpoint;
  signature: string;
};

export type CheckpointSigner = {
  signerRef: string;
  publicKeyPem: string;
  sign(message: string): string;
};

export const plannedCheckpointKms = {
  project: "pct-99",
  location: "us-central1",
  keyRing: "economy-checkpoints",
  key: "economy-ledger",
  purpose: "ASYMMETRIC_SIGN",
  algorithm: "EC_SIGN_ED25519",
  protection: "software",
  status: "blocked_pending_product_owner_approval",
} as const;

export function checkpointMessage(checkpoint: EconomicCheckpoint) {
  return canonicalize({
    checkpointAt: checkpoint.checkpointAt,
    eventCount: checkpoint.eventCount,
    format: checkpoint.format,
    lastEventHash: checkpoint.lastEventHash,
    lastSequence: checkpoint.lastSequence,
    missionId: checkpoint.missionId,
    signerRef: checkpoint.signerRef,
  });
}

export function checkpointFromEvents(events: EconomicEvent[], checkpointAt: string, signerRef: string): EconomicCheckpoint {
  if (events.length === 0) throw new Error("A checkpoint needs economic history.");
  verifyChain(events);
  const missionId = events[0].missionId;
  if (events.some((event) => event.missionId !== missionId)) throw new Error("A checkpoint covers one Mission.");
  const last = events[events.length - 1];
  return {
    format: checkpointFormat,
    missionId,
    lastSequence: String(last.sequence),
    lastEventHash: last.eventHash,
    eventCount: String(events.length),
    checkpointAt,
    signerRef,
  };
}

export function checkpointMatches(checkpoint: EconomicCheckpoint, events: EconomicEvent[]) {
  try {
    const current = checkpointFromEvents(events, checkpoint.checkpointAt, checkpoint.signerRef);
    return current.missionId === checkpoint.missionId
      && current.lastSequence === checkpoint.lastSequence
      && current.lastEventHash === checkpoint.lastEventHash
      && current.eventCount === checkpoint.eventCount;
  } catch {
    return false;
  }
}

export function signCheckpoint(checkpoint: EconomicCheckpoint, signer: CheckpointSigner): SignedCheckpoint {
  if (signer.signerRef !== checkpoint.signerRef) throw new Error("Checkpoint signer reference does not match.");
  return { checkpoint, signature: signer.sign(checkpointMessage(checkpoint)) };
}

export function verifyCheckpointSignature(signed: SignedCheckpoint, publicKeyPem: string) {
  return verify(null, Buffer.from(checkpointMessage(signed.checkpoint), "utf8"), createPublicKey(publicKeyPem), Buffer.from(signed.signature, "base64"));
}

export function localEd25519Signer(signerRef: string): CheckpointSigner {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  return {
    signerRef,
    publicKeyPem,
    sign(message: string) {
      return sign(null, Buffer.from(message, "utf8"), privateKey).toString("base64");
    },
  };
}

export function localEd25519SignerFromPem(signerRef: string, privateKeyPem: string, publicKeyPem: string): CheckpointSigner {
  const privateKey = createPrivateKey(privateKeyPem);
  return {
    signerRef,
    publicKeyPem,
    sign(message: string) {
      return sign(null, Buffer.from(message, "utf8"), privateKey).toString("base64");
    },
  };
}
