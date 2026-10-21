import assert from "node:assert/strict";
import test from "node:test";
import { firstWeek } from "@/missions/starter";
import { utilityByName } from "@/content/utilities";
import { agentNote, anyBrickPrompt, brickFile, brickPrompt, brickRepo } from "./agentBrick";

test("every rideshare brick can be handed to someone else's agent", () => {
  const rideshare = utilityByName("Rideshare 99");
  assert.ok(rideshare);
  for (const item of firstWeek(rideshare).work) {
    assert.match(brickFile(item.title), /^bricks\//, item.title);
    const prompt = brickPrompt(item);
    assert.match(prompt, new RegExp(item.title));
    assert.match(prompt, /outside owner gets 0/);
    assert.match(prompt, new RegExp(brickRepo.replaceAll(".", "\\.")));
    assert.equal(/equity/i.test(prompt), false);
  }
  const open = anyBrickPrompt();
  assert.match(open, /open issues/);
  assert.match(open, /outside owner gets 0/);
  assert.equal(/equity/i.test(`${open} ${agentNote}`), false);
  assert.match(agentNote, /No account on this site/);
});
