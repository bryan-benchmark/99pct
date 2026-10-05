import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CanonicalError, canonicalize } from "./canonical";
import { commandHash } from "./model";
import { MCU_MAX_MINOR, QuantityError, addMcu, formatMcu, parseMcu } from "./quantity";
import { verifyChain, sealDrafts } from "./chain";

test("canonical encoding rejects numbers, private fields, and key-order dependence", () => {
  assert.equal(canonicalize({ b: "2", a: "1" }), canonicalize({ a: "1", b: "2" }));
  assert.throws(() => canonicalize({ amount: 1 as never }), CanonicalError);
  assert.throws(() => canonicalize({ email: "person@example.test" }), CanonicalError);
});

test("MCU quantities stay integers inside a fixed range", () => {
  assert.equal(parseMcu("1000000"), BigInt(1000000));
  assert.equal(formatMcu(BigInt(-4)), "-4");
  assert.equal(addMcu(BigInt(3), BigInt(-1)), "2");
  assert.throws(() => parseMcu("1.5"), QuantityError);
  assert.throws(() => parseMcu("1e2"), QuantityError);
  assert.throws(() => parseMcu("01"), QuantityError);
  assert.throws(() => parseMcu(String(MCU_MAX_MINOR + BigInt(1))), QuantityError);
});

test("an event chain detects payload, link, sequence, and deletion changes", () => {
  let next = 0;
  const sealed = sealDrafts({
    missionId: "11111111-1111-4111-8111-111111111111",
    commandId: "22222222-2222-4222-8222-222222222222",
    actorKind: "process",
    actorRef: "recognition",
    drafts: [1, 2, 3].map((version) => ({
      eventType: "rule_activated" as const,
      subjectKind: "rule",
      subjectRef: "fixed",
      ruleId: "fixed",
      ruleVersion: version,
      payload: { ruleId: "fixed", version: String(version) },
    })),
    sequenceStart: 0,
    previousEventHash: null,
    ids: () => `33333333-3333-4333-8333-${String(++next).padStart(12, "0")}`,
    recordedAt: "2026-10-04T00:00:00.000Z",
  });
  verifyChain(sealed);
  const retimed = structuredClone(sealed);
  retimed[0].recordedAt = "1999-01-01T00:00:00.000Z";
  assert.throws(() => verifyChain(retimed));
  const mutated = structuredClone(sealed);
  mutated[0].payload.version = "9";
  assert.throws(() => verifyChain(mutated));
  assert.throws(() => verifyChain([sealed[0], sealed[2]]));
  assert.throws(() => verifyChain([sealed[1], sealed[0], sealed[2]]));
  assert.throws(() => verifyChain([sealed[0], sealed[0]]));
  const broken = structuredClone(sealed);
  broken[1].previousEventHash = "ab".repeat(32);
  assert.throws(() => verifyChain(broken));
});

test("the decision module does not reach for time, randomness, network, or an AI client", () => {
  const source = readFileSync(new URL("./engine/evaluate.ts", import.meta.url), "utf8");
  for (const token of ["Date.now", "new Date", "Math.random", "randomUUID", "fetch(", "openai", "llm"]) {
    assert.equal(source.includes(token), false, token);
  }
  const app = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.equal(app.includes("economic"), false);
});

test("the command hash binds the idempotency key", () => {
  const command = {
    missionId: "11111111-1111-4111-8111-111111111111",
    type: "publish_rule" as const,
    idempotencyKey: "rule-v1",
    actor: { kind: "process" as const, ref: "rule-publisher" },
    payload: { ruleId: "fixed" },
  };
  assert.notEqual(commandHash(command), commandHash({ ...command, idempotencyKey: "rule-v2" }));
});
