import type { PGlite } from "@electric-sql/pglite";
import { Pool, type PoolClient } from "pg";

export type MissionSql = {
  query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};

export type MissionDb = MissionSql & {
  transaction<T>(work: (tx: MissionSql) => Promise<T>): Promise<T>;
};

export function embeddedMissionDb(db: PGlite): MissionDb {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => db.query<T>(sql, params),
    exec: (sql) => db.exec(sql),
    transaction: (work) => db.transaction((tx) => work({
      query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => tx.query<T>(sql, params),
      exec: (sql) => tx.exec(sql),
    })),
  };
}

function pgRunner(client: PoolClient): MissionSql {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => client.query<T>(sql, params),
    exec: (sql) => client.query(sql),
  };
}

export function configuredMissionDb(connectionString = process.env.MISSION_DATABASE_URL): MissionDb & { close(): Promise<void> } {
  if (!connectionString) throw new Error("Mission database is not configured.");
  const pool = new Pool({
    connectionString,
    application_name: "pct99-missions",
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10_000,
    idle_in_transaction_session_timeout: 15_000,
  });
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => pool.query<T>(sql, params),
    exec: (sql) => pool.query(sql),
    transaction: async (work) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await work(pgRunner(client));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
