export const brickRepo = "https://github.com/bryan-benchmark/rideshare-99";

export const agentNote = "No account on this site. Paste this into Cursor, Claude, ChatGPT, or Codex. Your agent uses your own account and opens a public pull request. A username is enough.";

const files: Record<string, string> = {
  "Write the one-page description": "bricks/description.md",
  "Name the first city": "bricks/first-city.md",
  "List what a driver needs": "bricks/driver-needs.md",
  "List what a rider needs": "bricks/rider-needs.md",
  "Sketch the first screen": "bricks/first-screen.md",
  "Look after the list": "bricks/next-brick.md",
};

const rule = "Leave the fare rule alone. The driver keeps the fare. One cent of each dollar keeps the infrastructure running. An outside owner gets 0. The test fails if an outside owner takes a cut. Do not edit that test to allow it.";
const credit = "The name on the pull request is the credit. A GitHub username is enough. Use GitHub's private noreply email if you want your email off the commit. You do not need an account on 99pct.com. This does not pay anyone.";

export function brickFile(title: string) {
  return files[title] ?? "";
}

export function brickPrompt(item: { title: string; description: string; doneWhen: string }) {
  const file = files[item.title] ?? "bricks/improvement.md";
  return [
    "Build one brick for Rideshare 99. Use your own AI account. Open a public pull request.",
    "",
    `Repo: ${brickRepo}`,
    "Read AGENTS.md first.",
    "",
    `Brick: ${item.title}`,
    `What to do: ${item.description}`,
    `Done when: ${item.doneWhen}`,
    `Put the work in: ${file}`,
    "",
    rule,
    credit,
  ].join("\n");
}

export function anyBrickPrompt() {
  return [
    "Add one brick to Rideshare 99, or make a small improvement. Use your own AI account. Open a public pull request.",
    "",
    `Repo: ${brickRepo}`,
    "Read AGENTS.md and the open issues. Pick one open brick.",
    "",
    rule,
    credit,
  ].join("\n");
}
