import { createHash } from "node:crypto";

export type CanonicalValue =
  | null
  | boolean
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

const forbiddenKey = /email|uid|note|session|password|ssn|secret/i;

export class CanonicalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalError";
  }
}

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function canonicalize(value: CanonicalValue): string {
  return encode(value);
}

function encode(value: CanonicalValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => encode(item)).join(",")}]`;
  if (typeof value !== "object") throw new CanonicalError("Economic canonical values cannot contain numbers or undefined.");
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => {
    if (forbiddenKey.test(key)) throw new CanonicalError("Economic records cannot carry private identity fields.");
    if (!/^[\x20-\x7e]+$/.test(key)) throw new CanonicalError("Economic canonical keys must be printable ASCII.");
    return `${JSON.stringify(key)}:${encode(value[key])}`;
  }).join(",")}}`;
}

export function isCanonicalValue(value: unknown): value is CanonicalValue {
  try {
    assertCanonical(value);
    return true;
  } catch {
    return false;
  }
}

export function assertCanonical(value: unknown): asserts value is CanonicalValue {
  encode(asCanonical(value));
}

function asCanonical(value: unknown): CanonicalValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || value === undefined) {
    throw new CanonicalError("Economic canonical values cannot contain numbers or undefined.");
  }
  if (Array.isArray(value)) return value.map((item) => asCanonical(item));
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const record: { [key: string]: CanonicalValue } = {};
    for (const key of Object.keys(value)) record[key] = asCanonical((value as Record<string, unknown>)[key]);
    return record;
  }
  throw new CanonicalError("Economic canonical values must be plain data.");
}
