import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSpark } from "@/sparks/store";
import type { PilotDraft, PilotPlan } from "./types";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function planPath(sparkId: string, planId: string) {
  if (!idPattern.test(sparkId) || !idPattern.test(planId)) return null;
  const root = process.env.MISSION_SPARK_DATA_DIR || path.join(process.cwd(), ".data", "sparks");
  return path.join(root, sparkId, "pilots", `${planId}.json`);
}

export async function createPilotPlan(sparkId: string, draft: PilotDraft): Promise<PilotPlan | null> {
  if (!(await getSpark(sparkId))) return null;
  const plan: PilotPlan = {
    ...draft,
    id: randomUUID(),
    sparkId,
    createdAt: new Date().toISOString(),
    status: "candidate_for_review",
  };
  const file = planPath(sparkId, plan.id);
  if (!file) return null;
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(plan, null, 2), { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  return plan;
}

export async function getPilotPlan(sparkId: string, planId: string): Promise<PilotPlan | null> {
  const file = planPath(sparkId, planId);
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as PilotPlan;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
