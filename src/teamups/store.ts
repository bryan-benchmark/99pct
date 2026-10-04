import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TeamUpDraft, TeamUpProposal } from "./types";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function proposalPath(id: string) {
  if (!idPattern.test(id)) return null;
  const root = process.env.MISSION_TEAMUP_DATA_DIR || path.join(process.cwd(), ".data", "teamups");
  return path.join(root, `${id}.json`);
}

export async function createTeamUp(draft: TeamUpDraft): Promise<TeamUpProposal> {
  const proposal: TeamUpProposal = {
    ...draft,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "candidate_for_review",
    missionIds: ["toolshare-demo", "repair-demo"],
  };
  const file = proposalPath(proposal.id);
  if (!file) throw new Error("Could not create Team-Up proposal.");
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(proposal, null, 2), { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  return proposal;
}

export async function getTeamUp(id: string): Promise<TeamUpProposal | null> {
  const file = proposalPath(id);
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as TeamUpProposal;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
