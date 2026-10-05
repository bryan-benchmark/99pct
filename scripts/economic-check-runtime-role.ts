import { configuredEconomicDb } from "../src/economic/db/client";

const tables = ["schema_migrations", "command_intents", "intent_outcomes", "commands", "events", "rule_versions", "reward_keys", "checkpoints"] as const;
const kernelInsert = new Set(["commands", "events", "rule_versions", "reward_keys", "intent_outcomes", "checkpoints"]);
const functions = {
  human: "economic.submit_human_intent(uuid,text,text,jsonb)",
  recognition: "economic.submit_recognition_intent(uuid,text,text,jsonb)",
  governance: "economic.submit_governance_intent(uuid,text,text,jsonb)",
  bounty: "economic.submit_bounty_recognition_intent(uuid,text,jsonb)",
} as const;

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

async function assertRole(connection: string, label: string, insert: ReadonlySet<string>, execute: readonly string[]) {
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
      const canInsert = insert.has(table.relname);
      if (table.owner_member || !table.can_select || table.can_insert !== canInsert || table.can_update || table.can_delete
        || table.can_truncate || table.can_references || table.can_trigger) {
        throw new Error(`${label} role has incorrect privileges on ${table.relname}.`);
      }
    }
    for (const signature of Object.values(functions)) {
      const privilege = await db.query<{ ok: boolean }>("SELECT has_function_privilege(current_user, $1, 'EXECUTE') AS ok", [signature]);
      const allowed = execute.includes(signature);
      if (privilege.rows[0]?.ok !== allowed) throw new Error(`${label} role has incorrect execute privilege on ${signature}.`);
    }
    process.stdout.write(`Economic ${label} role ${account.role_name} has the expected limited privileges.\n`);
  } finally {
    await db.close();
  }
}

async function main() {
  const application = process.env.ECONOMIC_RUNTIME_DATABASE_URL;
  const recognition = process.env.ECONOMIC_RECOGNITION_DATABASE_URL;
  const governance = process.env.ECONOMIC_GOVERNANCE_DATABASE_URL;
  const bounty = process.env.ECONOMIC_BOUNTY_RECOGNITION_DATABASE_URL;
  const kernel = process.env.ECONOMIC_KERNEL_DATABASE_URL;
  const verifier = process.env.ECONOMIC_VERIFIER_DATABASE_URL;
  if (!application || !recognition || !governance || !bounty || !kernel || !verifier) {
    throw new Error("Economic submitter, kernel, and verifier database URLs are required.");
  }
  await assertRole(application, "application", new Set(), [functions.human]);
  await assertRole(recognition, "recognition", new Set(), [functions.recognition]);
  await assertRole(governance, "governance", new Set(), [functions.governance]);
  await assertRole(bounty, "bounty-recognition", new Set(), [functions.bounty]);
  await assertRole(kernel, "kernel", kernelInsert, []);
  await assertRole(verifier, "verifier", new Set(), []);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Economic role check failed."}\n`);
  process.exitCode = 1;
});
