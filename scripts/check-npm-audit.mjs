import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertNoFirestoreImports } from "./check-no-firestore.mjs";

const require = createRequire(import.meta.url);
const MODERATE = new Set(["moderate", "high", "critical"]);

export function daysBetween(start, end) {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

function advisoryId(via) {
  const url = via.url || "";
  const id = url.split("/").filter(Boolean).pop() || "";
  return id.toUpperCase();
}

export function validateExceptions(exceptions, today) {
  const errors = [];
  for (const ex of exceptions) {
    const span = daysBetween(ex.acceptedDate, ex.reviewDate);
    if (!(span >= 0 && span <= 30)) {
      errors.push(`${ex.advisoryId} review window must be 0–30 days (got ${span})`);
    }
    if (daysBetween(today, ex.reviewDate) < 0) {
      errors.push(`${ex.advisoryId} expired on ${ex.reviewDate}`);
    }
  }
  return errors;
}

function directAdvisories(info) {
  return (info.via || [])
    .filter((via) => typeof via === "object" && MODERATE.has(via.severity))
    .map(advisoryId)
    .filter(Boolean);
}

function carriedNames(info) {
  return (info.via || []).filter((via) => typeof via === "string");
}

function versionParts(version) {
  return String(version)
    .split("-")[0]
    .split(".")
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isNaN(value) ? null : value;
    });
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  if (a.some((part) => part === null) || b.some((part) => part === null)) return null;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const da = a[index] ?? 0;
    const db = b[index] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

export function versionInRange(version, range) {
  const text = String(range ?? "").trim();
  if (text === "" || text === "*") return true;
  if (text.includes("||")) return text.split("||").some((part) => versionInRange(version, part));
  const hyphen = text.match(/^(\d+(?:\.\d+)*)\s+-\s+(\d+(?:\.\d+)*)$/);
  if (hyphen) {
    const low = compareVersions(version, hyphen[1]);
    const high = compareVersions(version, hyphen[2]);
    if (low === null || high === null) return true;
    return low >= 0 && high <= 0;
  }
  const match = text.match(/^(<=|>=|<|>|=)?\s*(\d+(?:\.\d+)*)$/);
  if (!match) return true;
  const operator = match[1] || "=";
  const compared = compareVersions(version, match[2]);
  if (compared === null) return true;
  if (operator === "<") return compared < 0;
  if (operator === "<=") return compared <= 0;
  if (operator === ">") return compared > 0;
  if (operator === ">=") return compared >= 0;
  return compared === 0;
}

function advisoryRange(info, id) {
  const via = (info.via || []).find(
    (item) => typeof item === "object" && MODERATE.has(item.severity) && advisoryId(item) === id,
  );
  return via?.range || "*";
}

export function collectInstalls(tree, packageName, chain = []) {
  const found = [];
  for (const [name, child] of Object.entries(tree.dependencies || {})) {
    const next = [...chain, `${name}@${child.version}`];
    if (name === packageName) found.push({ path: next.join(" > "), version: child.version });
    found.push(...collectInstalls(child, packageName, next));
  }
  return found;
}

export function evaluateAudit({ audit, exceptions, versions, installs, today }) {
  const errors = validateExceptions(exceptions, today);
  const vulns = audit.vulnerabilities || {};
  const explained = new Set();
  const matched = new Set();

  for (const [name, info] of Object.entries(vulns)) {
    if (!MODERATE.has(info.severity)) continue;
    for (const id of directAdvisories(info)) {
      const ex = exceptions.find((item) => item.package === name && item.advisoryId.toUpperCase() === id);
      if (!ex) {
        errors.push(`${id} on ${name} has no exception`);
        continue;
      }
      if (versions[name] !== ex.installedVersion) {
        errors.push(`${id} on ${name} is ${versions[name] ?? "missing"}, exception allows ${ex.installedVersion}`);
        continue;
      }
      const copies = (installs[name] || []).filter((item) => item.version === ex.installedVersion);
      if (copies.length !== 1 || copies[0].path !== ex.dependencyPath) {
        errors.push(
          `${id} on ${name} path is ${(copies.map((item) => item.path).join(" | ") || "missing")}, exception allows ${ex.dependencyPath}`,
        );
        continue;
      }
      const recorded = exceptions.filter((item) => item.package === name && item.advisoryId.toUpperCase() === id);
      const range = advisoryRange(info, id);
      const unrecorded = (installs[name] || []).filter((item) => {
        const listed = recorded.some(
          (itemEx) => item.version === itemEx.installedVersion && item.path === itemEx.dependencyPath,
        );
        return !listed && versionInRange(item.version, range);
      });
      if (unrecorded.length > 0) {
        errors.push(
          `${id} on ${name} has an unrecorded vulnerable install: ${unrecorded.map((item) => item.path).join(" | ")}`,
        );
        continue;
      }
      explained.add(name);
      matched.add(`${ex.advisoryId.toUpperCase()}@${name}`);
    }
  }

  let grew = true;
  while (grew) {
    grew = false;
    for (const [name, info] of Object.entries(vulns)) {
      if (!MODERATE.has(info.severity) || explained.has(name) || directAdvisories(info).length > 0) continue;
      const via = carriedNames(info);
      if (via.length === 0 || !via.every((dep) => explained.has(dep))) continue;
      const allowed = exceptions.some(
        (ex) => matched.has(`${ex.advisoryId.toUpperCase()}@${ex.package}`) && ex.carriedBy.includes(name) && via.every((dep) => dep === ex.package || ex.carriedBy.includes(dep)),
      );
      if (!allowed) continue;
      explained.add(name);
      grew = true;
    }
  }

  for (const [name, info] of Object.entries(vulns)) {
    if (MODERATE.has(info.severity) && !explained.has(name)) {
      errors.push(`${name} is ${info.severity} and is not fixed or excepted`);
    }
  }

  for (const ex of exceptions) {
    if (!matched.has(`${ex.advisoryId.toUpperCase()}@${ex.package}`)) {
      errors.push(`${ex.advisoryId} on ${ex.package} does not match a current advisory`);
    }
  }

  return [...new Set(errors)];
}

function readExceptions() {
  const body = JSON.parse(readFileSync(new URL("../security/npm-audit-exceptions.json", import.meta.url), "utf8"));
  return body.exceptions;
}

function installedVersion(name) {
  return require(`${name}/package.json`).version;
}

function main() {
  const today = process.env.AUDIT_EXCEPTION_TODAY || new Date().toISOString().slice(0, 10);
  const exceptions = readExceptions();
  const auditRun = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
  if (!auditRun.stdout) {
    console.error(auditRun.stderr || "npm audit produced no JSON");
    process.exit(1);
  }
  const audit = JSON.parse(auditRun.stdout);
  const packages = [...new Set(exceptions.map((ex) => ex.package))];
  const ls = spawnSync("npm", ["ls", ...packages, "--all", "--json"], { encoding: "utf8" });
  const tree = JSON.parse(ls.stdout || "{}");
  const installs = {};
  const versions = {};
  for (const name of packages) {
    installs[name] = collectInstalls(tree, name);
    versions[name] = installedVersion(name);
  }
  const errors = evaluateAudit({ audit, exceptions, versions, installs, today });
  if (exceptions.some((ex) => ex.package === "@grpc/grpc-js" && ex.advisoryId.toUpperCase() === "GHSA-M9GG-HP2V-232J")) {
    try {
      assertNoFirestoreImports();
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  const counts = audit.metadata?.vulnerabilities || {};
  console.log(
    `npm audit policy ok; reported high=${counts.high ?? 0} moderate=${counts.moderate ?? 0} critical=${counts.critical ?? 0}`,
  );
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
