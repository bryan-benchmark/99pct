import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";

const tables = ["mission_schema_migrations", "human_accounts", "missions", "mission_revisions", "mission_environment", "projects", "project_revisions", "work_items", "work_revisions", "work_interests"] as const;
const canInsert = new Set<string>(["human_accounts", "missions", "mission_revisions", "projects", "project_revisions", "work_items", "work_revisions", "work_interests"]);
const canUpdate = new Set<string>();

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

async function main() {
  const connection = process.env.MISSION_RUNTIME_DATABASE_URL;
  if (!connection) throw new Error(missionDatabaseUnavailable);
  const db = configuredMissionDb(connection);
  try {
    const role = await db.query<{ role_name: string; superuser: boolean; create_role: boolean; create_db: boolean; create_schema: boolean; create_in_database: boolean }>(
      `SELECT current_user AS role_name, r.rolsuper AS superuser, r.rolcreaterole AS create_role,
              r.rolcreatedb AS create_db, has_schema_privilege(current_user, 'public', 'CREATE') AS create_schema,
              has_database_privilege(current_user, current_database(), 'CREATE') AS create_in_database
         FROM pg_roles r WHERE r.rolname = current_user`,
    );
    const account = role.rows[0];
    if (!account || account.superuser || account.create_role || account.create_db || account.create_schema || account.create_in_database) {
      throw new Error("Mission runtime role has database administration privileges.");
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
        WHERE n.nspname = 'public' AND c.relname = ANY($1::text[]) AND c.relkind = 'r'`,
      [tables],
    );
    if (result.rows.length !== tables.length) throw new Error("Mission schema tables are missing.");
    for (const table of result.rows) {
      if (table.owner_member || !table.can_select || table.can_insert !== canInsert.has(table.relname)
        || table.can_update !== canUpdate.has(table.relname) || table.can_delete || table.can_truncate
        || table.can_references || table.can_trigger) {
        throw new Error(`Mission runtime role has incorrect privileges on ${table.relname}.`);
      }
    }
    const columns = await db.query<{ column_name: string; can_update: boolean }>(
      `SELECT a.attname AS column_name,
              has_column_privilege(current_user, 'public.human_accounts', a.attname, 'UPDATE') AS can_update
         FROM pg_attribute a
        WHERE a.attrelid = 'public.human_accounts'::regclass AND a.attnum > 0 AND NOT a.attisdropped`,
    );
    if (columns.rows.length < 2 || columns.rows.some((column) => column.can_update !== (column.column_name === "verified_email"))) {
      throw new Error("Mission runtime role may update only the verified email.");
    }
    process.stdout.write(`Mission runtime role ${account.role_name} has the expected limited privileges.\n`);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission role check failed."}\n`);
  process.exitCode = 1;
});
