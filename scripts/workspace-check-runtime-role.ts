import { productionWorkspaceDb } from "../src/workspace/db/client";

const tables = [
  "workspace_schema_migrations", "workspace_users", "organizations", "memberships",
  "contract_revisions", "decisions", "decision_revisions", "decision_reviews",
  "audit_events", "invitations", "workspace_rate_limits", "workspace_environment",
] as const;
const canInsert = new Set<string>(tables.filter((name) => name !== "workspace_schema_migrations" && name !== "workspace_environment"));
const canUpdate = new Set<string>(["memberships", "invitations", "workspace_rate_limits"]);

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
  const db = productionWorkspaceDb();
  try {
    const role = await db.query<{ role_name: string; superuser: boolean; create_role: boolean; create_db: boolean; create_schema: boolean; create_in_database: boolean }>(
      `SELECT current_user AS role_name, r.rolsuper AS superuser, r.rolcreaterole AS create_role,
              r.rolcreatedb AS create_db, has_schema_privilege(current_user, 'public', 'CREATE') AS create_schema,
              has_database_privilege(current_user, current_database(), 'CREATE') AS create_in_database
         FROM pg_roles r WHERE r.rolname = current_user`,
    );
    const account = role.rows[0];
    if (!account || account.superuser || account.create_role || account.create_db || account.create_schema || account.create_in_database) {
      throw new Error("Workspace runtime role has database administration privileges.");
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
    if (result.rows.length !== tables.length) throw new Error("Workspace schema tables are missing.");
    for (const table of result.rows) {
      if (table.owner_member || !table.can_select || table.can_insert !== canInsert.has(table.relname)
          || table.can_update !== canUpdate.has(table.relname) || table.can_delete || table.can_truncate
          || table.can_references || table.can_trigger) {
        throw new Error(`Workspace runtime role has incorrect privileges on ${table.relname}.`);
      }
    }
    const columns = await db.query<{ column_name: string; can_update: boolean }>(
      `SELECT a.attname AS column_name,
              has_column_privilege(current_user, 'public.organizations', a.attname, 'UPDATE') AS can_update
         FROM pg_attribute a
        WHERE a.attrelid = 'public.organizations'::regclass AND a.attnum > 0 AND NOT a.attisdropped`,
    );
    if (columns.rows.length < 2 || columns.rows.some((column) => column.can_update !== (column.column_name === "id"))) {
      throw new Error("Workspace runtime role needs only the organization ID lock privilege.");
    }
    process.stdout.write(`Workspace runtime role ${account.role_name} has the expected limited privileges.\n`);
  } finally { await db.close(); }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Workspace role check failed."}\n`);
  process.exitCode = 1;
});
