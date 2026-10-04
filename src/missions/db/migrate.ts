import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { MissionDb } from "./client";

const migrationsDirectory = path.join(process.cwd(), "src", "missions", "db", "migrations");

async function migrationFiles() {
  const names = (await readdir(migrationsDirectory)).filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    return { name, sql, sha256: createHash("sha256").update(sql).digest("hex") };
  }));
}

export type MissionMigrationRecord = { name: string; sha256: string };

export function missionMigrationPrefixCurrent(known: MissionMigrationRecord[], installed: MissionMigrationRecord[]) {
  if (installed.length < known.length) return false;
  for (let index = 0; index < known.length; index += 1) {
    if (installed[index]?.name !== known[index].name || installed[index]?.sha256 !== known[index].sha256) return false;
  }
  for (let index = known.length; index < installed.length; index += 1) {
    if (installed[index].name <= installed[index - 1].name) return false;
  }
  return known.length > 0 || installed.length === 0;
}

export async function missionMigrationsCurrent(db: MissionDb) {
  const files = await migrationFiles();
  const installed = await db.query<MissionMigrationRecord>("SELECT name, sha256 FROM mission_schema_migrations ORDER BY name");
  return missionMigrationPrefixCurrent(files, installed.rows);
}

export async function migrateMissions(db: MissionDb) {
  await db.exec("CREATE TABLE IF NOT EXISTS mission_schema_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());");
  const files = await migrationFiles();
  const installed = await db.query<{ name: string; sha256: string }>("SELECT name, sha256 FROM mission_schema_migrations ORDER BY name");
  for (let index = 0; index < installed.rows.length; index += 1) {
    if (installed.rows[index].name !== files[index]?.name) throw new Error(`Mission migration history is out of order or missing: ${installed.rows[index].name}`);
  }
  const applied = new Map(installed.rows.map((row) => [row.name, row.sha256]));
  for (const { name, sql, sha256 } of files) {
    const previous = applied.get(name);
    if (previous && previous !== sha256) throw new Error(`Mission migration changed after application: ${name}`);
    if (previous) continue;
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("INSERT INTO mission_schema_migrations (name, sha256) VALUES ($1, $2)", [name, sha256]);
    });
  }
}
