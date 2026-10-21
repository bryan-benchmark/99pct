import assert from "node:assert/strict";
import test from "node:test";
import { bricksFromIssues, changesFromPulls } from "./githubWall";

test("open issues are bricks and pull requests are changes", () => {
  const bricks = bricksFromIssues([
    { number: 3, title: "Name the first city", html_url: "https://github.com/bryan-benchmark/rideshare-99/issues/3", body: "One city." },
    { number: 1, title: "Write the one-page description", html_url: "https://github.com/bryan-benchmark/rideshare-99/issues/1", body: "Put the work in bricks/description.md" },
    { number: 7, title: "A change", html_url: "https://github.com/bryan-benchmark/rideshare-99/pull/7", pull_request: {} },
    { title: "missing" },
  ]);
  assert.equal(bricks.length, 2);
  assert.deepEqual(bricks.map((brick) => brick.number), [1, 3]);
  assert.equal(bricks[0]?.number, 1);
  assert.match(bricks[0]?.prompt ?? "", /issue #1/);
  assert.match(bricks[0]?.prompt ?? "", /bricks\/description.md/);
  assert.equal(/equity/i.test(bricks[0]?.prompt ?? ""), false);
  const changes = changesFromPulls([
    { number: 7, title: "A change", html_url: "https://github.com/bryan-benchmark/rideshare-99/pull/7", user: { login: "ada" } },
    { number: 8, title: "No name", html_url: "https://github.com/bryan-benchmark/rideshare-99/pull/8" },
  ]);
  assert.deepEqual(changes.map((change) => change.author), ["ada", "someone"]);
  assert.deepEqual(bricksFromIssues({}), []);
  assert.deepEqual(changesFromPulls(null), []);
});
