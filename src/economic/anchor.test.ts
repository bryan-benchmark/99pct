import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { localEd25519Signer } from "./checkpoint/checkpoint";
import { anchorUncheckpointed } from "./checkpoint/anchor";
import { embeddedEconomicDb } from "./db/client";
import { commitCommand } from "./db/commit";
import { submitGovernanceIntent } from "./db/intent";
import { migrateEconomic } from "./db/migrate";
import { exportMission } from "./export/export";
import { firstRecognitionRule } from "./first-rule";
import { verifyAnchoredExport } from "./verify/verify";
import { processPendingIntents } from "./worker/process";

const definition = {
  amount: firstRecognitionRule.amount,
  kind: firstRecognitionRule.kind,
  scale: firstRecognitionRule.scale,
};

test("an unanchored ledger blocks the next command until a checkpoint verifies", async () => {
  const db = embeddedEconomicDb(new PGlite());
  await migrateEconomic(db);
  const missionId = randomUUID();
  await commitCommand(db, {
    missionId,
    type: "publish_rule",
    idempotencyKey: "rule-v1",
    actor: { kind: "process", ref: "rule-publisher" },
    payload: { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version, definition },
  });
  const failing = {
    signerRef: "local-test",
    publicKeyPem: "unused",
    sign() {
      throw new Error("signing unavailable");
    },
  };
  await submitGovernanceIntent(db, {
    missionId,
    commandType: "activate_rule",
    idempotencyKey: "activate-v1",
    payload: { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version },
  });
  const before = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM economic.events");
  await assert.rejects(() => processPendingIntents(db, "worker", 4, failing), /signing unavailable/);
  const afterFailure = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM economic.events");
  assert.equal(Number(afterFailure.rows[0].n), Number(before.rows[0].n));
  const outcomes = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM economic.intent_outcomes");
  assert.equal(Number(outcomes.rows[0].n), 0);

  const signer = localEd25519Signer("local-test");
  const processed = await processPendingIntents(db, "worker", 4, signer);
  assert.equal(processed, 1);
  const checkpoints = await db.query<{
    n: number;
  }>("SELECT count(*)::int AS n FROM economic.checkpoints");
  assert.equal(Number(checkpoints.rows[0].n), 2);
  assert.equal(await anchorUncheckpointed(db, signer), 0);
  const stored = await db.query<{
    mission_id: string; last_sequence: string; last_event_hash: string; event_count: string; checkpoint_at: Date | string; signer_ref: string; signature: string;
  }>("SELECT mission_id, last_sequence::text, last_event_hash, event_count::text, checkpoint_at, signer_ref, signature FROM economic.checkpoints ORDER BY last_sequence");
  const latest = stored.rows[1];
  const signed = {
    checkpoint: {
      format: "economic-checkpoint-v1" as const,
      missionId: latest.mission_id,
      lastSequence: latest.last_sequence,
      lastEventHash: latest.last_event_hash,
      eventCount: latest.event_count,
      checkpointAt: new Date(latest.checkpoint_at).toISOString(),
      signerRef: latest.signer_ref,
    },
    signature: latest.signature,
  };
  const verified = verifyAnchoredExport(await exportMission(db, missionId), signed, signer.publicKeyPem);
  assert.equal(verified.ok, true);
  const stale = verifyAnchoredExport(await exportMission(db, missionId), {
    checkpoint: { ...signed.checkpoint, lastSequence: stored.rows[0].last_sequence, lastEventHash: stored.rows[0].last_event_hash, eventCount: stored.rows[0].event_count },
    signature: stored.rows[0].signature,
  }, signer.publicKeyPem);
  assert.equal(stale.ok, false);
});
