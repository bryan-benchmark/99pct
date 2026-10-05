import type { PGlite } from "@electric-sql/pglite";
import { Pool, type PoolClient } from "pg";

export type EconomicSql = {
  query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};

export type EconomicDb = EconomicSql & {
  transaction<T>(work: (tx: EconomicSql) => Promise<T>): Promise<T>;
};

export function embeddedEconomicDb(db: PGlite): EconomicDb {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => db.query<T>(sql, params),
    exec: (sql) => db.exec(sql),
    transaction: (work) => db.transaction(async (tx) => {
      await tx.exec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      return work({
        query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => tx.query<T>(sql, params),
        exec: (sql) => tx.exec(sql),
      });
    }),
  };
}

function pgRunner(client: PoolClient): EconomicSql {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => client.query<T>(sql, params),
    exec: (sql) => client.query(sql),
  };
}

export function configuredEconomicDb(connectionString: string): EconomicDb & { close(): Promise<void> } {
  const pool = new Pool({
    connectionString,
    application_name: "pct99-economic",
    max: 8,
    connectionTimeoutMillis: 5000,
    statement_timeout: 20_000,
    idle_in_transaction_session_timeout: 20_000,
  });
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => pool.query<T>(sql, params),
    exec: (sql) => pool.query(sql),
    transaction: async (work) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
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
