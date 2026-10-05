import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { checkpointFromEvents, checkpointMessage, localEd25519Signer, signCheckpoint } from "../economic/checkpoint/checkpoint";
import { grantsFromVerifiedCheckpoint } from "../economic/checkpoint/trust";
import { embeddedEconomicDb } from "../economic/db/client";
import { commitCommand, listEconomicEvents } from "../economic/db/commit";
import { migrateEconomic } from "../economic/db/migrate";
import { exportMission } from "../economic/export/export";
import { firstRecognitionRule } from "../economic/first-rule";
import { recordAnchoredGrants } from "./bridge";
import { recognizeContributionRecord, submitContribution } from "./contributions";
import { embeddedMissionDb } from "./db/client";
import { migrateMissions } from "./db/migrate";
import { expressInterest, listCreatorInterests } from "./interest";
import { confirmParticipation, inviteInterest } from "./participation";
import { createProject, createWork } from "./projects";
import { createFormingMission } from "./store";

const creator = { uid: "human-1", email: "founder@example.test" };
const helper = { uid: "human-2", email: "helper@example.test" };

async function recognizedContribution() {
  const missions = embeddedMissionDb(new PGlite());
  await migrateMissions(missions);
  const mission = await createFormingMission(missions, creator, {
    name: "River School",
    purpose: "Teach children how the river works.",
    beneficiaries: "Children in the valley",
    startingPlace: "Global",
  });
  const project = await createProject(missions, creator, mission.slug, { title: "River lab", outcome: "Students can test the river water themselves." });
  const work = await createWork(missions, creator, mission.slug, project.slug, {
    kind: "task",
    title: "Collect sample bottles",
    description: "Bring clean bottles so the class can take water samples.",
    doneWhen: "Twenty labeled bottles are at the school.",
  });
  await expressInterest(missions, helper, mission.slug, project.slug, work.slug, { note: "I can bring bottles.", shareEmail: true });
  const interest = await listCreatorInterests(missions, mission.slug, project.slug, work.slug, creator.uid);
  await inviteInterest(missions, creator, mission.slug, project.slug, work.slug, interest[0].id);
  await confirmParticipation(missions, helper, mission.slug, project.slug, work.slug);
  const recorded = await submitContribution(missions, helper, mission.slug, project.slug, work.slug, {
    summary: "Brought twenty bottles.",
    evidence: "Bottles are in the lab.",
    idempotencyKey: "bottles-anchor",
  });
  await recognizeContributionRecord(missions, creator, mission.slug, project.slug, work.slug, recorded.id);
  await missions.query(
    "INSERT INTO contribution_bridge_outcomes (contribution_id, economic_intent_id) VALUES ($1, $2)",
    [recorded.id, "11111111-1111-4111-8111-111111111111"],
  );
  const missionId = (await missions.query<{ id: string }>("SELECT id FROM missions WHERE slug = $1", [mission.slug])).rows[0].id;
  return { missions, missionId, contributionId: recorded.id };
}

test("a matching checkpoint row cannot anchor a grant unless the trusted key verifies it", async () => {
  const { missions, missionId, contributionId } = await recognizedContribution();
  const economy = embeddedEconomicDb(new PGlite());
  await migrateEconomic(economy);
  const definition = { amount: firstRecognitionRule.amount, kind: firstRecognitionRule.kind, scale: firstRecognitionRule.scale };
  const publish = (type: "publish_rule" | "activate_rule" | "recognize_contribution", idempotencyKey: string, payload: Record<string, string | typeof definition>) => commitCommand(economy, {
    missionId,
    type,
    idempotencyKey,
    actor: { kind: "process", ref: type === "recognize_contribution" ? "recognition" : "rule-publisher" },
    payload,
  });
  await publish("publish_rule", "rule-v1", { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version, definition });
  await publish("activate_rule", "activate-v1", { ruleId: firstRecognitionRule.ruleId, version: firstRecognitionRule.version });
  await publish("recognize_contribution", "recognize-1", {
    contributionRef: `contribution:${contributionId}`,
    contributorRef: "contributor:abc123",
    evidenceRef: `evidence:${contributionId}`,
    ruleId: firstRecognitionRule.ruleId,
    ruleVersion: firstRecognitionRule.version,
  });
  const exported = await exportMission(economy, missionId);
  const events = await listEconomicEvents(economy, missionId);
  const trusted = localEd25519Signer("projects/pct-99/locations/us-central1/keyRings/economy-checkpoints/cryptoKeys/economy-ledger/cryptoKeyVersions/1");
  const signed = signCheckpoint(checkpointFromEvents(events, "2026-10-05T00:00:00.000Z", trusted.signerRef), trusted);
  const verified = grantsFromVerifiedCheckpoint(exported, signed, trusted.publicKeyPem, trusted.signerRef);
  assert.equal(verified.length, 1);
  assert.equal(verified[0].contributionId, contributionId);
  assert.equal(await recordAnchoredGrants(missions, verified), 1);

  const attacker = generateKeyPairSync("ed25519");
  const forged = {
    checkpoint: signed.checkpoint,
    signature: sign(null, Buffer.from(checkpointMessage(signed.checkpoint), "utf8"), attacker.privateKey).toString("base64"),
  };
  const fresh = await recognizedContribution();
  assert.equal(grantsFromVerifiedCheckpoint(exported, forged, trusted.publicKeyPem, trusted.signerRef).length, 0);
  assert.equal(await recordAnchoredGrants(fresh.missions, grantsFromVerifiedCheckpoint(exported, forged, trusted.publicKeyPem, trusted.signerRef)), 0);
  const substitutedKey = attacker.publicKey.export({ type: "spki", format: "pem" }).toString();
  assert.equal(grantsFromVerifiedCheckpoint(exported, signed, substitutedKey, trusted.signerRef).length, 0);
  const stale = signCheckpoint(checkpointFromEvents(events.slice(0, 1), "2026-10-05T00:00:00.000Z", trusted.signerRef), trusted);
  assert.equal(grantsFromVerifiedCheckpoint(exported, stale, trusted.publicKeyPem, trusted.signerRef).length, 0);
  const anchors = await fresh.missions.query<{ n: number }>("SELECT count(*)::int AS n FROM contribution_anchors");
  assert.equal(Number(anchors.rows[0].n), 0);
});
