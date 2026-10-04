import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { verifyChain } from "../chain";
import { configuredEconomicDb } from "../db/client";
import { commitCommand, listEconomicEvents } from "../db/commit";
import { migrateEconomic } from "../db/migrate";
import { EconomicRefusal, type EconomicCommand } from "../model";

const migrationUrl = process.env.ECONOMIC_MIGRATION_DATABASE_URL;
const runtimeUrl = process.env.ECONOMIC_RUNTIME_DATABASE_URL;
const verifierUrl = process.env.ECONOMIC_VERIFIER_DATABASE_URL;
if (!migrationUrl || !runtimeUrl || !verifierUrl) {
  throw new Error("Disposable economic PostgreSQL URLs are required.");
}

const definition = { amount: "1000000", kind: "fixed_mcu_on_recognition", scale: "6" };

function command(missionId: string, type: EconomicCommand["type"], idempotencyKey: string, actorRef: string, payload: EconomicCommand["payload"], kind: "human" | "process" = "process"): EconomicCommand {
  return { missionId, type, idempotencyKey, actor: { kind, ref: actorRef }, payload };
}

test("concurrent commands and bounty rewards produce one economic result", async () => {
  const owner = configuredEconomicDb(migrationUrl!);
  await migrateEconomic(owner);
  await owner.close();
  const db = configuredEconomicDb(runtimeUrl!);
  try {
    const missionId = randomUUID();
    await commitCommand(db, command(missionId, "publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
    await commitCommand(db, command(missionId, "activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
    const recognition = command(missionId, "recognize_contribution", "recognize-race", "recognition", {
      contributionRef: "contribution:race", contributorRef: "human:ada", evidenceRef: "evidence:race", ruleId: "fixed-recognition", ruleVersion: "1",
    });
    const raced = await Promise.all([commitCommand(db, recognition), commitCommand(db, recognition)]);
    assert.equal(raced[0].commandId, raced[1].commandId);
    assert.equal(raced.filter((result) => result.status === "accepted").length, 1);
    let events = await listEconomicEvents(db, missionId);
    verifyChain(events);
    assert.equal(events.filter((event) => event.eventType === "mcu_granted").length, 1);

    const bountyMission = randomUUID();
    await commitCommand(db, command(bountyMission, "publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
    await commitCommand(db, command(bountyMission, "activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
    await commitCommand(db, command(bountyMission, "publish_bounty_terms", "terms", "bounty-publisher", {
      bountyRef: "bounty:race", ruleId: "fixed-recognition", ruleVersion: "1", terms: { milestone: "completion" },
    }));
    await commitCommand(db, command(bountyMission, "confirm_bounty_participation", "join", "human:ada", { bountyRef: "bounty:race", beneficiaryRef: "human:ada" }, "human"));
    const completion = (key: string) => command(bountyMission, "recognize_bounty_completion", key, "bounty-recognition", {
      bountyRef: "bounty:race", beneficiaryRef: "human:ada", completionRef: "completion:once", evidenceRef: "evidence:photo",
    });
    const rewards = await Promise.allSettled([commitCommand(db, completion("reward-a")), commitCommand(db, completion("reward-b"))]);
    assert.equal(rewards.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(rewards.filter((result) => result.status === "rejected" && result.reason instanceof EconomicRefusal).length, 1);
    events = await listEconomicEvents(db, bountyMission);
    verifyChain(events);
    assert.equal(events.filter((event) => event.eventType === "bounty_reward_granted").length, 1);
    assert.equal(new Set(events.map((event) => event.sequence)).size, events.length);

    await assert.rejects(() => db.query("UPDATE economic.events SET subject_ref = 'changed'"));
    await assert.rejects(() => db.query("DELETE FROM economic.rule_versions"));
    await assert.rejects(() => db.exec("TRUNCATE economic.events"));
    const verifier = configuredEconomicDb(verifierUrl!);
    try {
      await assert.rejects(() => verifier.query(
        "INSERT INTO economic.commands (id, mission_id, command_type, idempotency_key, canonical_hash, canonical_payload, actor_kind, actor_ref, received_at) VALUES ($1,$2,'publish_rule','x','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','{}'::jsonb,'process','rule-publisher',now())",
        [randomUUID(), randomUUID()],
      ));
    } finally {
      await verifier.close();
    }
  } finally {
    await db.close();
  }
});
