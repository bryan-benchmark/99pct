import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { sealDrafts } from "./chain";
import {
  checkpointFromEvents,
  checkpointMatches,
  localEd25519Signer,
  localEd25519SignerFromPem,
  plannedCheckpointKms,
  signCheckpoint,
  verifyCheckpointSignature,
} from "./checkpoint/checkpoint";

function sampleEvents() {
  return sealDrafts({
    missionId: "11111111-1111-4111-8111-111111111111",
    commandId: "22222222-2222-4222-8222-222222222222",
    actorKind: "process",
    actorRef: "rule-publisher",
    drafts: [1, 2].map((version) => ({
      eventType: "rule_activated" as const,
      subjectKind: "rule",
      subjectRef: "fixed",
      ruleId: "fixed",
      ruleVersion: version,
      payload: { ruleId: "fixed", version: String(version) },
    })),
    sequenceStart: 0,
    previousEventHash: null,
    ids: (() => {
      let next = 0;
      return () => `33333333-3333-4333-8333-${String(++next).padStart(12, "0")}`;
    })(),
    recordedAt: "2026-10-04T00:00:00.000Z",
  });
}

test("a signed checkpoint anchors one Mission and rejects tampering", () => {
  const events = sampleEvents();
  const signer = localEd25519Signer("test-checkpoint");
  const other = generateKeyPairSync("ed25519");
  const otherPublic = other.publicKey.export({ type: "spki", format: "pem" }).toString();
  const stable = localEd25519SignerFromPem("test-checkpoint", other.privateKey.export({ type: "pkcs8", format: "pem" }).toString(), otherPublic);
  const signed = signCheckpoint(checkpointFromEvents(events, "2026-10-04T00:00:00.000Z", signer.signerRef), signer);
  const again = signCheckpoint(signed.checkpoint, signer);
  assert.equal(again.signature, signed.signature);
  assert.equal(verifyCheckpointSignature(signed, signer.publicKeyPem), true);
  assert.equal(checkpointMatches(signed.checkpoint, events), true);
  assert.equal(verifyCheckpointSignature(signed, otherPublic), false);
  assert.equal(stable.sign(signed.checkpoint.missionId), stable.sign(signed.checkpoint.missionId));

  const changedSequence = structuredClone(signed);
  changedSequence.checkpoint.lastSequence = "99";
  assert.equal(verifyCheckpointSignature(changedSequence, signer.publicKeyPem), false);
  const changedHash = structuredClone(signed);
  changedHash.checkpoint.lastEventHash = "ab".repeat(32);
  assert.equal(verifyCheckpointSignature(changedHash, signer.publicKeyPem), false);
  const changedMission = structuredClone(signed);
  changedMission.checkpoint.missionId = "99999999-9999-4999-8999-999999999999";
  assert.equal(verifyCheckpointSignature(changedMission, signer.publicKeyPem), false);

  const reordered = [events[1], events[0]];
  assert.equal(checkpointMatches(signed.checkpoint, reordered), false);
  const corrupted = structuredClone(events);
  corrupted[1].eventHash = "cd".repeat(32);
  assert.equal(checkpointMatches(signed.checkpoint, corrupted), false);
  assert.equal(plannedCheckpointKms.status, "spend_approved_2026-10-04");
  assert.equal(plannedCheckpointKms.project, "pct-99");
});
