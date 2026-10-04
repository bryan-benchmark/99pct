import { configuredEconomicDb } from "../src/economic/db/client";

const tables = ["schema_migrations", "commands", "events", "rule_versions", "reward_keys"] as const;

type TablePrivilege = {
  relname: string;
  owner_member: boolean;
  can_select: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_truncate: boolean;
  can_references: boolean;
  can_trigger: boolean;
};

async function assertRole(connection: string, insert: boolean, label: string) {
  const db = configuredEconomicDb(connection);
  try {
    const role = await db.query<{ role_name: string; superuser: boolean; create_role: boolean; create_db: boolean; create_schema: boolean; create_in_database: boolean }>(
      `SELECT current_user AS role_name, r.rolsuper AS superuser, r.rolcreaterole AS create_role,
              r.rolcreatedb AS create_db, has_schema_privilege(current_user, 'economic', 'CREATE') AS create_schema,
              has_database_privilege(current_user, current_database(), 'CREATE') AS create_in_database
         FROM pg_roles r WHERE r.rolname = current_user`,
    );
    const account = role.rows[0];
    if (!account || account.superuser || account.create_role || account.create_db || account.create_schema || account.create_in_database) {
      throw new Error(`${label} role has database administration privileges.`);
    }
    const result = await db.query<TablePrivilege>(
      `SELECT c.relname, pg_has_role(current_user, c.relowner, 'MEMBER') AS owner_member,
              has_table_privilege(current_user, c.oid, 'SELECT') AS can_select,
              has_table_privilege(current_user, c.oid, 'INSERT') AS can_insert,
              has_table_privilege(current_user, c.oid, 'UPDATE') AS can_update,
              has_table_privilege(current_user, c.oid, 'DELETE') AS can_delete,
              has_table_privilege(current_user, c.oid, 'TRUNCATE') AS can_truncate,
              has_table_privilege(current_user, c.oid, 'REFERENCES') AS can_references,
              has_table_privilege(current_user, c.oid, 'TRIGGER') AS can_trigger
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'economic' AND c.relname = ANY($1::text[]) AND c.relkind = 'r'`,
      [tables],
    );
    if (result.rows.length !== tables.length) throw new Error("Economic schema tables are missing.");
    for (const table of result.rows) {
      const canInsert = insert && table.relname !== "schema_migrations";
      if (table.owner_member || !table.can_select || table.can_insert !== canInsert || table.can_update || table.can_delete
        || table.can_truncate || table.can_references || table.can_trigger) {
        throw new Error(`${label} role has incorrect privileges on ${table.relname}.`);
      }
    }
    process.stdout.write(`Economic ${label} role ${account.role_name} has the expected limited privileges.\n`);
  } finally {
    await db.close();
  }
}

async function main() {
  const runtime = process.env.ECONOMIC_RUNTIME_DATABASE_URL;
  const verifier = process.env.ECONOMIC_VERIFIER_DATABASE_URL;
  if (!runtime || !verifier) throw new Error("Economic runtime and verifier database URLs are required.");
  await assertRole(runtime, true, "runtime");
  await assertRole(verifier, false, "verifier");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic role check failed."}\n`);
  process.exitCode = 1;
});
