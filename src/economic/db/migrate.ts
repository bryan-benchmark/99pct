import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { EconomicDb } from "./client";

const migrationsDirectory = path.join(process.cwd(), "src", "economic", "db", "migrations");

async function migrationFiles() {
  const names = (await readdir(migrationsDirectory)).filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    return { name, sql, sha256: createHash("sha256").update(sql).digest("hex") };
  }));
}

export function assertEconomicMigrationTarget(connection: string, allowProductionShadow = false) {
  let database = "";
  try {
    database = decodeURIComponent(new URL(connection).pathname.replace(/^\//, ""));
  } catch {
    throw new Error("Economic migration URL is invalid.");
  }
  if (database === "missions" || database === "") throw new Error("Refusing to apply the economic kernel to the Mission product database.");
  const productionInstance = connection.includes("pct99-missions-prod");
  if (productionInstance && database !== "economy") {
    throw new Error("Refusing to apply economic migrations outside the production economy database.");
  }
  if (productionInstance && !allowProductionShadow) {
    throw new Error("Production shadow migration requires ECONOMIC_PRODUCTION_SHADOW=1.");
  }
}

export async function economicMigrationsCurrent(db: Pick<EconomicDb, "query">) {
  const files = await migrationFiles();
  const installed = await db.query<{ name: string; sha256: string }>("SELECT name, sha256 FROM economic.schema_migrations ORDER BY name");
  if (installed.rows.length !== files.length) return false;
  return installed.rows.every((row, index) => row.name === files[index].name && row.sha256 === files[index].sha256);
}

export async function migrateEconomic(db: EconomicDb) {
  await db.exec("CREATE SCHEMA IF NOT EXISTS economic");
  await db.exec("CREATE TABLE IF NOT EXISTS economic.schema_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const files = await migrationFiles();
  const installed = await db.query<{ name: string; sha256: string }>("SELECT name, sha256 FROM economic.schema_migrations ORDER BY name");
  for (let index = 0; index < installed.rows.length; index += 1) {
    if (installed.rows[index].name !== files[index]?.name) throw new Error(`Economic migration history is out of order or missing: ${installed.rows[index].name}`);
  }
  const applied = new Map(installed.rows.map((row) => [row.name, row.sha256]));
  for (const { name, sql, sha256 } of files) {
    const previous = applied.get(name);
    if (previous && previous !== sha256) throw new Error(`Economic migration changed after application: ${name}`);
    if (previous) continue;
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("INSERT INTO economic.schema_migrations (name, sha256) VALUES ($1, $2)", [name, sha256]);
    });
  }
}
