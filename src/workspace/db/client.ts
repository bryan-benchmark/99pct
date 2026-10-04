import type { PGlite } from "@electric-sql/pglite";
import { Pool, type PoolClient } from "pg";

export const workspaceStatementTimeoutMs = 10_000;
export const workspaceIdleTransactionTimeoutMs = 15_000;

export type WorkspaceSql = {
  query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};

export type WorkspaceDb = WorkspaceSql & {
  transaction<T>(work: (tx: WorkspaceSql) => Promise<T>): Promise<T>;
};

export function embeddedWorkspaceDb(db: PGlite): WorkspaceDb {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => db.query<T>(sql, params),
    exec: (sql) => db.exec(sql),
    transaction: (work) => db.transaction((tx) => work({
      query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => tx.query<T>(sql, params),
      exec: (sql) => tx.exec(sql),
    })),
  };
}

function pgRunner(client: PoolClient): WorkspaceSql {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => client.query<T>(sql, params),
    exec: (sql) => client.query(sql),
  };
}

export function productionWorkspaceDb(connectionString = process.env.DATABASE_URL, options: { statementTimeoutMs?: number; idleTransactionTimeoutMs?: number } = {}): WorkspaceDb & { close(): Promise<void> } {
  if (!connectionString) throw new Error("DATABASE_URL is required for the customer workspace.");
  const pool = new Pool({
    connectionString,
    application_name: "missionism-workspace",
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: options.statementTimeoutMs ?? workspaceStatementTimeoutMs,
    idle_in_transaction_session_timeout: options.idleTransactionTimeoutMs ?? workspaceIdleTransactionTimeoutMs,
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
