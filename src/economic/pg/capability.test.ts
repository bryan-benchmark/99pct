import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { commandFromIntent } from "../capability";
import { configuredEconomicDb, type EconomicDb } from "../db/client";
import { commitCommand, listEconomicEvents } from "../db/commit";
import { submitBountyRecognitionIntent, submitGovernanceIntent, submitHumanIntent, submitRecognitionIntent } from "../db/intent";
import { migrateEconomic } from "../db/migrate";
import type { EconomicCommand } from "../model";
import { processPendingIntents } from "../worker/process";

const migrationUrl = process.env.ECONOMIC_MIGRATION_DATABASE_URL;
const runtimeUrl = process.env.ECONOMIC_RUNTIME_DATABASE_URL;
const recognitionUrl = process.env.ECONOMIC_RECOGNITION_DATABASE_URL;
const governanceUrl = process.env.ECONOMIC_GOVERNANCE_DATABASE_URL;
const bountyUrl = process.env.ECONOMIC_BOUNTY_RECOGNITION_DATABASE_URL;
const kernelUrl = process.env.ECONOMIC_KERNEL_DATABASE_URL;
if (!migrationUrl || !runtimeUrl || !recognitionUrl || !governanceUrl || !bountyUrl || !kernelUrl) {
  throw new Error("Disposable economic capability database URLs are required.");
}

const definition = { amount: "1000000", kind: "fixed_mcu_on_recognition", scale: "6" };

function command(missionId: string, type: EconomicCommand["type"], idempotencyKey: string, actorRef: string, payload: EconomicCommand["payload"], kind: "human" | "process" = "process"): EconomicCommand {
  return { missionId, type, idempotencyKey, actor: { kind, ref: actorRef }, payload };
}

async function outcomeCount(db: EconomicDb, intentId: string) {
  const result = await db.query<{ count: string }>("SELECT count(*)::text AS count FROM economic.intent_outcomes WHERE intent_id = $1", [intentId]);
  return result.rows[0]?.count;
}

test("submitter capabilities cannot cross channels and workers append one outcome", async () => {
  const owner = configuredEconomicDb(migrationUrl!);
  await migrateEconomic(owner);
  await owner.close();
  const kernel = configuredEconomicDb(kernelUrl!);
  const application = configuredEconomicDb(runtimeUrl!);
  const recognition = configuredEconomicDb(recognitionUrl!);
  const governance = configuredEconomicDb(governanceUrl!);
  const bounty = configuredEconomicDb(bountyUrl!);
  const missionId = randomUUID();
  try {
    await commitCommand(kernel, command(missionId, "publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
    await commitCommand(kernel, command(missionId, "activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));

    await assert.rejects(() => submitRecognitionIntent(application, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "app-recognition",
      payload: { contributionRef: "contribution:app", contributorRef: "human:ada", evidenceRef: "evidence:app", ruleId: "fixed-recognition", ruleVersion: "1" },
    }));
    await assert.rejects(() => submitGovernanceIntent(application, {
      missionId, commandType: "publish_rule", idempotencyKey: "app-rule", payload: { ruleId: "fixed-recognition", version: "9", definition },
    }));
    await assert.rejects(() => submitBountyRecognitionIntent(application, {
      missionId, idempotencyKey: "app-bounty", payload: { bountyRef: "bounty:x", beneficiaryRef: "human:ada", completionRef: "completion:x", evidenceRef: "evidence:x" },
    }));
    await assert.rejects(() => application.query(
      `INSERT INTO economic.commands (id, mission_id, command_type, idempotency_key, canonical_hash, canonical_payload, actor_kind, actor_ref, received_at)
       VALUES ($1,$2,'recognize_contribution','direct','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','{}'::jsonb,'process','recognition',now())`,
      [randomUUID(), missionId],
    ));

    const disguised = await submitHumanIntent(application, {
      missionId, idempotencyKey: "pretend-recognition", actorRef: "recognition", payload: { bountyRef: "bounty:x", beneficiaryRef: "recognition" },
    });
    const stored = await kernel.query<{ actor_kind: string; actor_ref: string; command_type: string; submitter_capability: string }>(
      "SELECT actor_kind, actor_ref, command_type, submitter_capability FROM economic.command_intents WHERE id = $1",
      [disguised.id],
    );
    assert.equal(stored.rows[0]?.actor_kind, "human");
    assert.equal(stored.rows[0]?.command_type, "confirm_bounty_participation");
    assert.equal(stored.rows[0]?.submitter_capability, "human");
    assert.equal(commandFromIntent({
      id: disguised.id,
      mission_id: missionId,
      command_type: "confirm_bounty_participation",
      idempotency_key: "pretend-recognition",
      actor_kind: "human",
      actor_ref: "recognition",
      payload: { bountyRef: "bounty:x", beneficiaryRef: "recognition" },
      submitter_capability: "human",
    }).actor.kind, "human");

    await assert.rejects(() => recognition.query(
      "SELECT economic.submit_recognition_intent($1, 'publish_rule', 'smuggle', '{}'::jsonb)",
      [missionId],
    ));
    await assert.rejects(() => submitGovernanceIntent(recognition, {
      missionId, commandType: "publish_rule", idempotencyKey: "rec-rule", payload: { ruleId: "fixed-recognition", version: "2", definition },
    }));
    await assert.rejects(() => governance.query(
      "SELECT economic.submit_governance_intent($1, 'recognize_contribution', 'smuggle', '{}'::jsonb)",
      [missionId],
    ));
    await assert.rejects(() => submitRecognitionIntent(governance, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "gov-rec",
      payload: { contributionRef: "contribution:gov", contributorRef: "human:ada", evidenceRef: "evidence:gov", ruleId: "fixed-recognition", ruleVersion: "1" },
    }));
    await assert.rejects(() => submitRecognitionIntent(bounty, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "bounty-rec",
      payload: { contributionRef: "contribution:bounty", contributorRef: "human:ada", evidenceRef: "evidence:bounty", ruleId: "fixed-recognition", ruleVersion: "1" },
    }));
    await assert.rejects(() => submitGovernanceIntent(bounty, {
      missionId, commandType: "activate_rule", idempotencyKey: "bounty-rule", payload: { ruleId: "fixed-recognition", version: "1" },
    }));
    for (const role of [recognition, governance, bounty]) {
      await assert.rejects(() => role.query(
        `INSERT INTO economic.events (
           id, mission_id, sequence, event_type, command_id, actor_kind, actor_ref, subject_kind, subject_ref,
           payload, payload_hash, event_hash, recorded_at
         ) VALUES ($1,$2,99,'mcu_granted',$3,'process','recognition','contributor','human:ada','{}'::jsonb,$4,$4,now())`,
        [randomUUID(), missionId, randomUUID(), "ab".repeat(32)],
      ));
    }

    const first = await submitRecognitionIntent(recognition, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "recognize-once",
      payload: { contributionRef: "contribution:once", contributorRef: "human:ada", evidenceRef: "evidence:once", ruleId: "fixed-recognition", ruleVersion: "1" },
    });
    const raced = [configuredEconomicDb(kernelUrl!), configuredEconomicDb(kernelUrl!)];
    try {
      await Promise.all(raced.map((worker, index) => processPendingIntents(worker, `worker-${index}`)));
    } finally {
      await Promise.all(raced.map((worker) => worker.close()));
    }
    assert.equal((await listEconomicEvents(kernel, missionId)).filter((event) => event.eventType === "mcu_granted").length, 1);
    assert.equal(await outcomeCount(kernel, first.id), "1");
    assert.equal(await outcomeCount(kernel, disguised.id), "1");

    const second = await submitRecognitionIntent(recognition, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "recognize-two",
      payload: { contributionRef: "contribution:two", contributorRef: "human:ada", evidenceRef: "evidence:two", ruleId: "fixed-recognition", ruleVersion: "1" },
    });
    const third = await submitRecognitionIntent(recognition, {
      missionId, commandType: "recognize_contribution", idempotencyKey: "recognize-three",
      payload: { contributionRef: "contribution:three", contributorRef: "human:bea", evidenceRef: "evidence:three", ruleId: "fixed-recognition", ruleVersion: "1" },
    });
    const parallel = [configuredEconomicDb(kernelUrl!), configuredEconomicDb(kernelUrl!)];
    try {
      await Promise.all(parallel.map((worker, index) => processPendingIntents(worker, `parallel-${index}`)));
    } finally {
      await Promise.all(parallel.map((worker) => worker.close()));
    }
    assert.equal((await listEconomicEvents(kernel, missionId)).filter((event) => event.eventType === "mcu_granted").length, 3);
    assert.equal(await outcomeCount(kernel, second.id), "1");
    assert.equal(await outcomeCount(kernel, third.id), "1");

    const crashMission = randomUUID();
    await commitCommand(kernel, command(crashMission, "publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
    await commitCommand(kernel, command(crashMission, "activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
    const crashed = await submitRecognitionIntent(recognition, {
      missionId: crashMission, commandType: "recognize_contribution", idempotencyKey: "recognize-crash",
      payload: { contributionRef: "contribution:crash", contributorRef: "human:ada", evidenceRef: "evidence:crash", ruleId: "fixed-recognition", ruleVersion: "1" },
    });
    const crashedRow = await kernel.query<{
      id: string; mission_id: string; command_type: string; idempotency_key: string; actor_kind: string; actor_ref: string; payload: EconomicCommand["payload"]; submitter_capability: string;
    }>("SELECT id, mission_id, command_type, idempotency_key, actor_kind, actor_ref, payload, submitter_capability FROM economic.command_intents WHERE id = $1", [crashed.id]);
    await commitCommand(kernel, commandFromIntent(crashedRow.rows[0]));
    const committed = (await listEconomicEvents(kernel, crashMission)).length;
    assert.equal(await processPendingIntents(kernel, "crash-recovery"), 1);
    assert.equal((await listEconomicEvents(kernel, crashMission)).length, committed);
    assert.equal(await outcomeCount(kernel, crashed.id), "1");
    assert.equal(await processPendingIntents(kernel, "crash-recovery-again"), 0);

    const governed = randomUUID();
    const published = await submitGovernanceIntent(governance, {
      missionId: governed, commandType: "publish_rule", idempotencyKey: "publish-shadow",
      payload: { ruleId: "fixed-recognition", version: "1", definition },
    });
    assert.equal(await processPendingIntents(kernel, "governance-worker"), 1);
    assert.equal((await listEconomicEvents(kernel, governed)).filter((event) => event.eventType === "rule_published").length, 1);
    assert.equal(await outcomeCount(kernel, published.id), "1");

    const bountyMission = randomUUID();
    await commitCommand(kernel, command(bountyMission, "publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
    await commitCommand(kernel, command(bountyMission, "activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
    await commitCommand(kernel, command(bountyMission, "publish_bounty_terms", "terms", "bounty-publisher", {
      bountyRef: "bounty:shadow", ruleId: "fixed-recognition", ruleVersion: "1", terms: { milestone: "completion" },
    }));
    await commitCommand(kernel, command(bountyMission, "confirm_bounty_participation", "join", "human:ada", { bountyRef: "bounty:shadow", beneficiaryRef: "human:ada" }, "human"));
    const completion = await submitBountyRecognitionIntent(bounty, {
      missionId: bountyMission, idempotencyKey: "completion-shadow",
      payload: { bountyRef: "bounty:shadow", beneficiaryRef: "human:ada", completionRef: "completion:shadow", evidenceRef: "evidence:shadow" },
    });
    assert.equal(await processPendingIntents(kernel, "bounty-worker"), 1);
    assert.equal((await listEconomicEvents(kernel, bountyMission)).filter((event) => event.eventType === "bounty_reward_granted").length, 1);
    assert.equal(await outcomeCount(kernel, completion.id), "1");
  } finally {
    await Promise.all([kernel.close(), application.close(), recognition.close(), governance.close(), bounty.close()]);
  }
});
