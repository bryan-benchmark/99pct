import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Interest, Spark, SparkDraft, SparkInput } from "./types";
import { inputOptions } from "./types";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function root() {
  return process.env.MISSION_SPARK_DATA_DIR || path.join(process.cwd(), ".data", "sparks");
}

function proposalPath(id: string) {
  if (!idPattern.test(id)) return null;
  return path.join(root(), id, "proposal.json");
}

export async function createSpark(draft: SparkDraft): Promise<Spark> {
  const spark: Spark = { ...draft, id: randomUUID(), createdAt: new Date().toISOString() };
  const file = proposalPath(spark.id);
  if (!file) throw new Error("Could not create proposal.");
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(spark, null, 2), { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  return spark;
}

export async function getSpark(id: string): Promise<Spark | null> {
  const file = proposalPath(id);
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as Spark;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function interestPath(id: string, browserId: string) {
  if (!idPattern.test(id) || !idPattern.test(browserId)) return null;
  const digest = createHash("sha256").update(browserId).digest("hex");
  return path.join(root(), id, "interest", `${digest}.json`);
}

export async function addInterest(id: string, browserId: string, inputs: SparkInput[]): Promise<"added" | "duplicate" | "missing"> {
  if (!(await getSpark(id))) return "missing";
  const file = interestPath(id, browserId);
  if (!file) return "missing";
  await mkdir(path.dirname(file), { recursive: true });
  const interest: Interest = { inputs, createdAt: new Date().toISOString() };
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(interest), { flag: "wx", mode: 0o600 });
    await link(temporary, file);
    return "added";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return "duplicate";
    throw error;
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function getInterest(id: string, browserId: string): Promise<Interest | null> {
  const file = interestPath(id, browserId);
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as Interest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getInterestCounts(id: string) {
  if (!idPattern.test(id)) return null;
  const directory = path.join(root(), id, "interest");
  let files: string[];
  try {
    files = (await readdir(directory)).filter((name) => /^[0-9a-f]{64}\.json$/.test(name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") files = [];
    else throw error;
  }
  const counts = Object.fromEntries(inputOptions.map((input) => [input, 0])) as Record<SparkInput, number>;
  let responses = 0;
  for (const name of files) {
    const interest = JSON.parse(await readFile(path.join(directory, name), "utf8")) as Interest;
    responses += 1;
    for (const input of interest.inputs) {
      if (input in counts) counts[input] += 1;
    }
  }
  return { responses, counts };
}
