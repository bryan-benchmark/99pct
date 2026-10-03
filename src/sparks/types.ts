export const inputLabels = {
  demand: "I would use it",
  money: "I may help fund it",
  work: "I may help run it",
  skills: "I can offer skills",
  assets: "I may offer equipment or materials",
  space: "I may offer space",
} as const;

export const needLabels: Record<keyof typeof inputLabels, string> = {
  demand: "People who would use it",
  money: "Possible funding",
  work: "People to help run it",
  skills: "Specialized skills",
  assets: "Equipment or materials",
  space: "A place to operate",
};

export type SparkInput = keyof typeof inputLabels;
export const inputOptions = Object.keys(inputLabels) as SparkInput[];

export type SparkDraft = {
  wish: string;
  name: string;
  people: string;
  place: string;
  pilot: string;
  evidence: string;
  inputs: SparkInput[];
};

export type Spark = SparkDraft & {
  id: string;
  createdAt: string;
};

export type Interest = {
  inputs: SparkInput[];
  createdAt: string;
};

const limits = {
  wish: 500,
  name: 80,
  people: 160,
  place: 120,
  pilot: 400,
  evidence: 400,
} as const;

export function parseInputs(value: unknown, requireOne = false): SparkInput[] {
  if (!Array.isArray(value) || value.length > inputOptions.length) {
    throw new Error("Choose valid ways to help.");
  }
  const inputs = value as unknown[];
  if (requireOne && inputs.length === 0) {
    throw new Error("Choose at least one way to help.");
  }
  if (inputs.some((item) => typeof item !== "string" || !inputOptions.includes(item as SparkInput))) {
    throw new Error("Choose valid ways to help.");
  }
  if (new Set(inputs).size !== inputs.length) {
    throw new Error("Choose each way to help only once.");
  }
  return inputs as SparkInput[];
}

export function parseDraft(value: unknown): SparkDraft {
  if (typeof value !== "object" || value === null) {
    throw new Error("Complete the proposal before saving it.");
  }
  const record = value as Record<string, unknown>;
  const fields = {} as Pick<SparkDraft, keyof typeof limits>;
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    const raw = record[key];
    if (typeof raw !== "string" || !raw.trim() || raw.trim().length > limits[key]) {
      throw new Error(`Enter ${key} using ${limits[key]} characters or fewer.`);
    }
    fields[key] = raw.trim();
  }
  return { ...fields, inputs: parseInputs(record.inputs) };
}
