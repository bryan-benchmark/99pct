import { Pool, type PoolConfig, type PoolClient } from "pg";
import type { MissionDb } from "./client";
import { missionPoolMax, type MissionProductionConfig } from "./config";

export type SqlConnector = {
  getOptions(request: { instanceConnectionName: string }): Promise<PoolConfig>;
  close(): void | Promise<void>;
};

export async function googleCloudSqlConnector(): Promise<SqlConnector> {
  const { AuthTypes, Connector, IpAddressTypes } = await import("@google-cloud/cloud-sql-connector");
  const connector = new Connector();
  return {
    getOptions: (request) => connector.getOptions({
      instanceConnectionName: request.instanceConnectionName,
      authType: AuthTypes.PASSWORD,
      ipType: IpAddressTypes.PUBLIC,
    }),
    close: () => connector.close(),
  };
}

function pgRunner(client: PoolClient) {
  return {
    query: async <T extends Record<string, unknown>>(sql: string, params?: unknown[]) => client.query<T>(sql, params),
    exec: (sql: string) => client.query(sql),
  };
}

export async function openCloudSqlMissionDb(
  config: MissionProductionConfig,
  connector: SqlConnector,
  createPool: (config: PoolConfig) => Pool = (poolConfig) => new Pool(poolConfig),
): Promise<MissionDb & { close(): Promise<void> }> {
  const driverOptions = await connector.getOptions({ instanceConnectionName: config.instanceConnectionName });
  if ("connectionString" in driverOptions || "host" in driverOptions) throw new Error("Mission database is not configured.");
  const pool = createPool({
    ...driverOptions,
    user: config.user,
    password: config.password,
    database: config.databaseName,
    max: missionPoolMax,
    application_name: "pct99-missions",
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
    close: async () => {
      await pool.end();
      await connector.close();
    },
  };
}
