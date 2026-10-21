import { brickRepo } from "./agentBrick";

const credit = "The name on the pull request is the credit. A GitHub username is enough. Use GitHub's private noreply email if you want your email off the commit. You do not need an account on 99pct.com. This does not pay anyone.";

export type Brick = {
  number: number;
  title: string;
  url: string;
  prompt: string;
};

export type Change = {
  number: number;
  title: string;
  url: string;
  author: string;
};

export type Wall = {
  live: boolean;
  bricks: Brick[];
  changes: Change[];
};

type IssueItem = {
  number?: number;
  title?: string;
  html_url?: string;
  body?: string | null;
  pull_request?: unknown;
  user?: { login?: string } | null;
};

export function bricksFromIssues(items: unknown): Brick[] {
  if (!Array.isArray(items)) return [];
  const bricks: Brick[] = [];
  for (const item of items as IssueItem[]) {
    if (!item || item.pull_request || typeof item.number !== "number" || typeof item.title !== "string" || typeof item.html_url !== "string") continue;
    const body = typeof item.body === "string" ? item.body.trim() : "";
    bricks.push({
      number: item.number,
      title: item.title,
      url: item.html_url,
      prompt: [
        `Build GitHub issue #${item.number} on ${brickRepo}. Use your own AI account. Open a public pull request.`,
        "",
        item.title,
        item.html_url,
        "",
        body,
        "",
        credit,
      ].join("\n"),
    });
  }
  return bricks.sort((a, b) => a.number - b.number);
}

export function changesFromPulls(items: unknown): Change[] {
  if (!Array.isArray(items)) return [];
  const changes: Change[] = [];
  for (const item of items as IssueItem[]) {
    if (!item || typeof item.number !== "number" || typeof item.title !== "string" || typeof item.html_url !== "string") continue;
    changes.push({
      number: item.number,
      title: item.title,
      url: item.html_url,
      author: item.user?.login || "someone",
    });
  }
  return changes;
}

const issuesUrl = "https://api.github.com/repos/bryan-benchmark/rideshare-99/issues?state=open&per_page=50";
const pullsUrl = "https://api.github.com/repos/bryan-benchmark/rideshare-99/pulls?state=open&per_page=20";

let cached: { at: number; wall: Wall } | null = null;

export async function loadGithubWall(now = Date.now()): Promise<Wall> {
  if (cached && now - cached.at < 5 * 60 * 1000) return cached.wall;
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "99pct" };
    const [issues, pulls] = await Promise.all([
      fetch(issuesUrl, { headers, next: { revalidate: 300 } }),
      fetch(pullsUrl, { headers, next: { revalidate: 300 } }),
    ]);
    if (!issues.ok || !pulls.ok) throw new Error("GitHub did not answer.");
    const wall = { live: true, bricks: bricksFromIssues(await issues.json()), changes: changesFromPulls(await pulls.json()) };
    cached = { at: now, wall };
    return wall;
  } catch {
    return cached?.wall ?? { live: false, bricks: [], changes: [] };
  }
}
