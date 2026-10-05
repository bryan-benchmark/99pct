import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { AuthTypes, Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { assertEconomicMigrationTarget, migrateEconomic } from "../src/economic/db/migrate";
import type { EconomicDb } from "../src/economic/db/client";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const instance = required("ECONOMIC_DB_INSTANCE");
  const database = required("ECONOMIC_DB_NAME");
  const user = required("ECONOMIC_DB_USER");
  const password = required("ECONOMIC_DB_PASSWORD");
  if (database === "missions") throw new Error("Refusing to open the Mission product database for an economic command.");
  const connector = new Connector();
  const driver = await connector.getOptions({
    instanceConnectionName: instance,
    authType: AuthTypes.PASSWORD,
    ipType: IpAddressTypes.PUBLIC,
  });
  const pool = new Pool({
    ...driver,
    user,
    password,
    database,
    max: 2,
    application_name: "pct99-economic-operator",
    connectionTimeoutMillis: 15000,
  });
  const db: EconomicDb & { close(): Promise<void> } = {
    query: (sql, params) => pool.query(sql, params),
    exec: (sql) => pool.query(sql),
    transaction: async (work) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await work({
          query: (sql, params) => client.query(sql, params),
          exec: (sql) => client.query(sql),
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: async () => {
      await pool.end();
      connector.close();
    },
  };
  try {
    const action = process.argv[2];
    if (action === "--migrate") {
      assertEconomicMigrationTarget(`postgresql://${user}@/${database}?host=/cloudsql/${instance}`, process.env.ECONOMIC_PRODUCTION_SHADOW === "1");
      await migrateEconomic(db);
      process.stdout.write("Economic migrations applied.\n");
    } else if (action === "--file") {
      const sql = await readFile(required("ECONOMIC_SQL_FILE"), "utf8");
      await db.exec(sql);
      process.stdout.write("Economic SQL applied.\n");
    } else if (action === "--query") {
      const result = await db.query<Record<string, unknown>>(required("ECONOMIC_SQL"));
      process.stdout.write(`${JSON.stringify(result.rows)}\n`);
    } else {
      throw new Error("Use --migrate, --file, or --query.");
    }
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic Cloud SQL command failed."}\n`);
  process.exitCode = 1;
});
