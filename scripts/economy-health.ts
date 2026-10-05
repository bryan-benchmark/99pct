import { configuredEconomicDb } from "../src/economic/db/client";
import { economicMigrationsCurrent } from "../src/economic/db/migrate";

const requiredTables = ["schema_migrations", "command_intents", "intent_outcomes", "commands", "events", "rule_versions", "reward_keys"];

async function main() {
  const connection = process.env.ECONOMIC_VERIFIER_DATABASE_URL ?? process.env.ECONOMIC_MIGRATION_DATABASE_URL;
  if (!connection) throw new Error("ECONOMIC_VERIFIER_DATABASE_URL is required.");
  const db = configuredEconomicDb(connection);
  try {
    if (!await economicMigrationsCurrent(db)) throw new Error("Economic migrations are not current.");
    const tables = await db.query<{ relname: string }>(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'economic' AND c.relkind = 'r' AND c.relname = ANY($1::text[])`,
      [requiredTables],
    );
    if (tables.rows.length !== requiredTables.length) throw new Error("Economic tables are missing.");
    const triggers = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM pg_trigger t
         JOIN pg_class c ON c.oid = t.tgrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_proc p ON p.oid = t.tgfoid
        WHERE n.nspname = 'economic' AND NOT t.tgisinternal AND p.proname = 'reject_mutation'`,
    );
    if (Number(triggers.rows[0]?.count) < 18) throw new Error("Append-only economic triggers are missing.");
    const events = await db.query<{ count: string }>("SELECT count(*)::text AS count FROM economic.events");
    const grants = await db.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM economic.events WHERE event_type IN ('mcu_granted', 'bounty_reward_granted')",
    );
    if (process.env.ECONOMIC_HEALTH_REQUIRE_EMPTY === "1" && events.rows[0]?.count !== "0") {
      throw new Error("Production shadow ledger is not empty.");
    }
    process.stdout.write(`ready events=${events.rows[0]?.count ?? "0"} grants=${grants.rows[0]?.count ?? "0"}\n`);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic health check failed."}\n`);
  process.exitCode = 1;
});
