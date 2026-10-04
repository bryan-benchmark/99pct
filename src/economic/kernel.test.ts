import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { authorizeAiProposal } from "./ai/boundary";
import { embeddedEconomicDb, type EconomicDb } from "./db/client";
import { commitCommand, listEconomicEvents } from "./db/commit";
import { migrateEconomic } from "./db/migrate";
import { bountyState, mcuTotal, rewardIssued } from "./engine/derive";
import { evaluate } from "./engine/evaluate";
import { exportMission } from "./export/export";
import { EconomicRefusal, type EconomicCommand } from "./model";
import { verifyExport } from "./verify/verify";

const mission = "11111111-1111-4111-8111-111111111111";

async function database() {
  const db = embeddedEconomicDb(new PGlite());
  await migrateEconomic(db);
  return db;
}

function actor(ref: string, kind: "human" | "process" = "process"): EconomicCommand["actor"] {
  return { kind, ref };
}

function command(type: EconomicCommand["type"], idempotencyKey: string, actorRef: string, payload: EconomicCommand["payload"], kind: "human" | "process" = "process"): EconomicCommand {
  return { missionId: mission, type, idempotencyKey, actor: actor(actorRef, kind), payload };
}

async function countEvents(db: EconomicDb, missionId = mission) {
  const result = await db.query<{ count: string | number }>("SELECT count(*)::text AS count FROM economic.events WHERE mission_id = $1", [missionId]);
  return Number(result.rows[0].count);
}

test("recognition grants once, corrections compensate, and a new rule does not rewrite the old grant", async () => {
  const db = await database();
  const definition = (amount: string) => ({ amount, kind: "fixed_mcu_on_recognition", scale: "6" });
  await commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition: definition("1000000") }));
  await commitCommand(db, command("activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
  const recognized = await commitCommand(db, command("recognize_contribution", "recognize-1", "recognition", {
    contributionRef: "contribution:field-notes", contributorRef: "human:ada", evidenceRef: "evidence:notebook", ruleId: "fixed-recognition", ruleVersion: "1",
  }));
  assert.equal(recognized.eventIds.length, 2);
  const replay = await commitCommand(db, command("recognize_contribution", "recognize-1", "recognition", {
    contributionRef: "contribution:field-notes", contributorRef: "human:ada", evidenceRef: "evidence:notebook", ruleId: "fixed-recognition", ruleVersion: "1",
  }));
  assert.equal(replay.status, "replayed");
  assert.equal(replay.commandId, recognized.commandId);
  assert.deepEqual(replay.eventIds, recognized.eventIds);
  await assert.rejects(() => commitCommand(db, command("recognize_contribution", "recognize-1-other", "recognition", {
    contributionRef: "contribution:field-notes", contributorRef: "human:ada", evidenceRef: "evidence:notebook", ruleId: "fixed-recognition", ruleVersion: "1",
  })), (error: unknown) => error instanceof EconomicRefusal && error.code === "invalid_state");
  let events = await listEconomicEvents(db, mission);
  assert.equal(mcuTotal(events, "human:ada"), BigInt(1000000));
  const grant = events.find((event) => event.eventType === "mcu_granted");
  assert.ok(grant);
  assert.equal(grant.payload.amount, "1000000");
  assert.equal(grant.ruleVersion, 1);
  await commitCommand(db, command("adjust_mcu", "adjust-1", "recognition", { originalEventId: grant.id, delta: "-400000", reasonRef: "reason:correction" }));
  events = await listEconomicEvents(db, mission);
  assert.equal(events.find((event) => event.id === grant.id)?.payload.amount, "1000000");
  assert.equal(mcuTotal(events, "human:ada"), BigInt(600000));
  await commitCommand(db, command("publish_rule", "rule-v2", "rule-publisher", { ruleId: "fixed-recognition", version: "2", definition: definition("1500000") }));
  await commitCommand(db, command("activate_rule", "activate-v2", "rule-publisher", { ruleId: "fixed-recognition", version: "2" }));
  await commitCommand(db, command("recognize_contribution", "recognize-2", "recognition", {
    contributionRef: "contribution:map", contributorRef: "human:ada", evidenceRef: "evidence:map", ruleId: "fixed-recognition", ruleVersion: "2",
  }));
  events = await listEconomicEvents(db, mission);
  assert.equal(events.find((event) => event.id === grant.id)?.payload.amount, "1000000");
  assert.equal(events.filter((event) => event.eventType === "mcu_granted").map((event) => event.payload.amount).join(","), "1000000,1500000");
  assert.equal(mcuTotal(events, "human:ada"), BigInt(2100000));
  const exported = await exportMission(db, mission);
  const verified = verifyExport(exported);
  assert.equal(verified.ok, true);
  if (verified.ok) assert.equal(mcuTotal(verified.events, "human:ada"), BigInt(2100000));
  const lines = exported.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
  const fail = (changed: Record<string, unknown>[]) => assert.equal(verifyExport(`${changed.map((line) => JSON.stringify(line)).join("\n")}\n`).ok, false);
  const amountEdited = structuredClone(lines);
  const grantLine = amountEdited.find((line) => line.eventType === "mcu_granted");
  (grantLine?.payload as { amount: string }).amount = "1000001";
  fail(amountEdited);
  const subjectEdited = structuredClone(lines);
  const subject = subjectEdited.find((line) => line.eventType === "mcu_granted");
  if (subject) subject.subjectRef = "human:other";
  fail(subjectEdited);
  const versionEdited = structuredClone(lines);
  const version = versionEdited.find((line) => line.eventType === "mcu_granted");
  if (version) version.ruleVersion = "2";
  fail(versionEdited);
  fail(lines.filter((line, index) => index !== lines.findIndex((item) => item.record === "event")));
  const reordered = structuredClone(lines);
  const firstEvent = reordered.findIndex((line) => line.record === "event");
  [reordered[firstEvent], reordered[firstEvent + 1]] = [reordered[firstEvent + 1], reordered[firstEvent]];
  fail(reordered);
  fail([...lines, lines.find((line) => line.record === "event") ?? {}]);
  const broken = structuredClone(lines);
  const linked = broken.find((line) => line.record === "event" && line.previousEventHash);
  if (linked) linked.previousEventHash = "ab".repeat(32);
  fail(broken);
  const ruleEdited = structuredClone(lines);
  const rule = ruleEdited.find((line) => line.record === "rule");
  (rule?.definition as { amount: string }).amount = "42";
  fail(ruleEdited);
  const duplicated = structuredClone(lines);
  const last = duplicated.filter((line) => line.record === "event").at(-1);
  if (last) {
    const copy = structuredClone(last);
    copy.id = "66666666-6666-4666-8666-666666666666";
    copy.sequence = String(Number(last.sequence) + 1);
    copy.previousEventHash = last.eventHash;
    duplicated.push(copy);
  }
  fail(duplicated);
  const file = path.join(mkdtempSync(path.join(tmpdir(), "economy-")), "mission.ndjson");
  writeFileSync(file, exported);
  const cli = spawnSync(process.execPath, ["--import", "tsx", "scripts/economy-verify.ts", file], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
});

test("a bounty reward is pinned to its published rule and cannot be granted twice", async () => {
  const db = await database();
  const definition = (amount: string) => ({ amount, kind: "fixed_mcu_on_recognition", scale: "6" });
  await commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition: definition("500000") }));
  await commitCommand(db, command("activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
  await commitCommand(db, command("publish_bounty_terms", "terms", "bounty-publisher", {
    bountyRef: "bounty:samples", ruleId: "fixed-recognition", ruleVersion: "1", terms: { milestone: "completion" },
  }));
  await commitCommand(db, command("publish_rule", "rule-v2", "rule-publisher", { ruleId: "fixed-recognition", version: "2", definition: definition("900000") }));
  await commitCommand(db, command("activate_rule", "activate-v2", "rule-publisher", { ruleId: "fixed-recognition", version: "2" }));
  await commitCommand(db, command("confirm_bounty_participation", "join", "human:ada", { bountyRef: "bounty:samples", beneficiaryRef: "human:ada" }, "human"));
  const rewarded = await commitCommand(db, command("recognize_bounty_completion", "done", "bounty-recognition", {
    bountyRef: "bounty:samples", beneficiaryRef: "human:ada", completionRef: "completion:bottles", evidenceRef: "evidence:photo",
  }));
  const events = await listEconomicEvents(db, mission);
  const reward = events.find((event) => event.eventType === "bounty_reward_granted");
  assert.ok(reward);
  assert.equal(reward.payload.amount, "500000");
  assert.equal(reward.payload.ruleVersion, "1");
  assert.equal(reward.ruleVersion, 1);
  assert.equal(bountyState(events, "bounty:samples", "human:ada"), "rewarded");
  assert.equal(rewardIssued(events, `${mission}:bounty:samples:human:ada:completion:bottles`), true);
  assert.equal(mcuTotal(events, "human:ada"), BigInt(500000));
  const replay = await commitCommand(db, command("recognize_bounty_completion", "done", "bounty-recognition", {
    bountyRef: "bounty:samples", beneficiaryRef: "human:ada", completionRef: "completion:bottles", evidenceRef: "evidence:photo",
  }));
  assert.equal(replay.status, "replayed");
  assert.deepEqual(replay.eventIds, rewarded.eventIds);
  await assert.rejects(() => commitCommand(db, command("recognize_bounty_completion", "done-again", "bounty-recognition", {
    bountyRef: "bounty:samples", beneficiaryRef: "human:ada", completionRef: "completion:bottles", evidenceRef: "evidence:photo",
  })), (error: unknown) => error instanceof EconomicRefusal);
  assert.equal(await countEvents(db), events.length);
});

test("invalid commands fail closed without appending events", async () => {
  const db = await database();
  const definition = { amount: "1000000", kind: "fixed_mcu_on_recognition", scale: "6" };
  const before = await countEvents(db);
  const attempts: unknown[] = [
    command("recognize_contribution", "missing-rule", "recognition", { contributionRef: "contribution:one", contributorRef: "human:ada", evidenceRef: "evidence:one", ruleId: "fixed-recognition", ruleVersion: "1" }),
    command("publish_rule", "bad-actor", "intern", { ruleId: "fixed-recognition", version: "1", definition }),
    command("publish_rule", "too-big", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition: { ...definition, amount: "1".padEnd(40, "0") } }),
    command("publish_rule", "extra", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition, note: "private" }),
  ];
  for (const attempt of attempts) {
    await assert.rejects(() => commitCommand(db, attempt), (error: unknown) => error instanceof EconomicRefusal);
  }
  await commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
  await assert.rejects(() => commitCommand(db, command("recognize_contribution", "inactive", "recognition", {
    contributionRef: "contribution:one", contributorRef: "human:ada", evidenceRef: "evidence:one", ruleId: "fixed-recognition", ruleVersion: "1",
  })), (error: unknown) => error instanceof EconomicRefusal && error.code === "inactive_rule");
  await assert.rejects(() => commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "9", definition })), (error: unknown) => error instanceof EconomicRefusal && error.code === "idempotency_conflict");
  await assert.rejects(() => commitCommand(db, command("recognize_bounty_completion", "early", "bounty-recognition", {
    bountyRef: "bounty:samples", beneficiaryRef: "human:ada", completionRef: "completion:bottles", evidenceRef: "evidence:photo",
  })), (error: unknown) => error instanceof EconomicRefusal && error.code === "invalid_state");
  const published = await listEconomicEvents(db, mission);
  assert.throws(() => evaluate(published, { ...command("activate_rule", "other-mission", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }), missionId: "99999999-9999-4999-8999-999999999999" }), (error: unknown) => error instanceof EconomicRefusal && error.code === "wrong_mission");
  assert.equal(await countEvents(db), before + 1);
});

test("stored history is append-only and a broken prefix blocks the next command", async () => {
  const db = await database();
  const definition = { amount: "1000000", kind: "fixed_mcu_on_recognition", scale: "6" };
  const published = await commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1", definition }));
  await commitCommand(db, command("activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
  await assert.rejects(() => db.query("UPDATE economic.events SET subject_ref = 'rewritten'"));
  await assert.rejects(() => db.query("DELETE FROM economic.rule_versions"));
  await assert.rejects(() => db.exec("TRUNCATE economic.events"));
  const columns = await db.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema = 'economic' AND column_name ILIKE '%balance%'");
  assert.equal(columns.rows.length, 0);
  const before = await countEvents(db);
  await db.query(
    `INSERT INTO economic.events (
       id, mission_id, sequence, event_type, command_id, actor_kind, actor_ref, subject_kind, subject_ref,
       rule_id, rule_version, payload, payload_hash, previous_event_hash, event_hash, recorded_at
     ) VALUES ($1,$2,3,'rule_activated',$3,'process','rule-publisher','rule','fixed-recognition','fixed-recognition',1,$4::jsonb,$5,$6,$7,now())`,
    [
      "55555555-5555-4555-8555-555555555555", mission, published.commandId,
      "{\"ruleId\":\"fixed-recognition\",\"version\":\"1\"}", "ab".repeat(32), "cd".repeat(32), "ef".repeat(32),
    ],
  );
  await assert.rejects(() => commitCommand(db, command("publish_rule", "rule-v2", "rule-publisher", { ruleId: "fixed-recognition", version: "2", definition: { ...definition, amount: "1500000" } })), (error: unknown) => error instanceof EconomicRefusal && error.code === "broken_history");
  assert.equal(await countEvents(db), before + 1);
});

test("an AI proposal is not a command until a deterministic authorizer accepts it", async () => {
  const db = await database();
  const proposal = {
    kind: "ai_proposal" as const,
    missionId: mission,
    proposedType: "recognize_contribution",
    proposedPayload: {
      contributionRef: "contribution:field-notes",
      contributorRef: "human:ada",
      evidenceRef: "evidence:notebook",
      ruleId: "fixed-recognition",
      ruleVersion: "1",
      amount: "999",
    },
    modelNote: "draft only",
  };
  await assert.rejects(() => commitCommand(db, proposal), (error: unknown) => error instanceof EconomicRefusal && error.code === "ai_boundary");
  assert.equal(await countEvents(db), 0);
  const authorized = authorizeAiProposal({
    ...proposal,
    proposedPayload: {
      contributionRef: "contribution:field-notes",
      contributorRef: "human:ada",
      evidenceRef: "evidence:notebook",
      ruleId: "fixed-recognition",
      ruleVersion: "1",
    },
  }, { kind: "process", ref: "recognition" }, "ai-1");
  await commitCommand(db, command("publish_rule", "rule-v1", "rule-publisher", {
    ruleId: "fixed-recognition", version: "1", definition: { amount: "1000000", kind: "fixed_mcu_on_recognition", scale: "6" },
  }));
  await commitCommand(db, command("activate_rule", "activate-v1", "rule-publisher", { ruleId: "fixed-recognition", version: "1" }));
  const granted = await commitCommand(db, authorized);
  assert.equal(granted.status, "accepted");
  const events = await listEconomicEvents(db, mission);
  assert.equal(events.find((event) => event.eventType === "mcu_granted")?.payload.amount, "1000000");
  const boundary = readFileSync(new URL("./ai/boundary.ts", import.meta.url), "utf8");
  assert.equal(boundary.includes("commitCommand"), false);
});
