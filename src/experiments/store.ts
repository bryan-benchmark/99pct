import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExperimentDraft, ExperimentProposal } from "./types";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function experimentPath(id: string) {
  if (!idPattern.test(id)) return null;
  return path.join(process.env.MISSION_EXPERIMENT_DATA_DIR || path.join(process.cwd(), ".data", "experiments"), `${id}.json`);
}

export async function createExperiment(draft: ExperimentDraft): Promise<ExperimentProposal> {
  const proposal: ExperimentProposal = { ...draft, id: randomUUID(), missionId: "toolshare-demo", createdAt: new Date().toISOString(), status: "proposed_for_review" };
  const file = experimentPath(proposal.id);
  if (!file) throw new Error("Could not create experiment proposal.");
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

export async function getExperiment(id: string): Promise<ExperimentProposal | null> {
  const file = experimentPath(id);
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as ExperimentProposal;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
