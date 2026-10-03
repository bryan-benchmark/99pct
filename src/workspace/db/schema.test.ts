import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { embeddedWorkspaceDb, productionWorkspaceDb } from "./client";
import { migrateWorkspace, workspaceMigrationsCurrent } from "./migrate";

const orgA = "a7620f75-4e12-45bf-a2cc-6c6cdfaf6111";
const orgB = "d4d01c19-77d6-44b1-b28a-c70c4e992222";
const decisionId = "32f76909-7acf-48c1-9224-4747b70b5e12";

test("migrations replay and customer records survive database restart", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mission-workspace-db-"));
  try {
    const first = new PGlite(directory);
    await migrateWorkspace(embeddedWorkspaceDb(first));
    assert.equal(await workspaceMigrationsCurrent(embeddedWorkspaceDb(first)), true);
    await first.query("INSERT INTO workspace_users(id, email) VALUES ($1, $2)", ["u1", "one@example.test"]);
    await first.query("INSERT INTO organizations(id, name) VALUES ($1, $2)", [orgA, "First org"]);
    await first.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')", [orgA, "u1"]);
    await first.close();
    const second = new PGlite(directory);
    await migrateWorkspace(embeddedWorkspaceDb(second));
    assert.equal(await workspaceMigrationsCurrent(embeddedWorkspaceDb(second)), true);
    const result = await second.query<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [orgA]);
    assert.equal(result.rows[0]?.name, "First org");
    await second.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("tenant foreign keys, immutable history, and transaction rollback", async () => {
  const db = new PGlite();
  try {
    await migrateWorkspace(embeddedWorkspaceDb(db));
    await db.query("INSERT INTO workspace_users(id, email) VALUES ('u1', 'one@example.test'), ('u2', 'two@example.test')");
    await db.query("INSERT INTO organizations(id, name) VALUES ($1, 'First org'), ($2, 'Second org')", [orgA, orgB]);
    await db.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'u1', 'owner', 'active'), ($2, 'u2', 'owner', 'active')", [orgA, orgB]);
    await db.query("INSERT INTO contract_revisions(org_id, revision, author_id, status, answers) VALUES ($1, 1, 'u1', 'submitted', '{}')", [orgA]);
    await assert.rejects(db.query("INSERT INTO decisions(org_id, id, contract_revision, created_by) VALUES ($1, $2, 1, 'u2')", [orgB, decisionId]));
    await assert.rejects(db.query("UPDATE contract_revisions SET status = 'draft' WHERE org_id = $1", [orgA]));
    await assert.rejects(db.transaction(async (tx) => {
      await tx.query("INSERT INTO decisions(org_id, id, contract_revision, created_by) VALUES ($1, $2, 1, 'u1')", [orgA, decisionId]);
      throw new Error("Simulated failure before audit event");
    }));
    const result = await db.query("SELECT id FROM decisions WHERE org_id = $1", [orgA]);
    assert.equal(result.rows.length, 0);
  } finally {
    await db.close();
  }
});

test("production database does not fall back to local files", () => {
  assert.throws(() => productionWorkspaceDb(""), /DATABASE_URL is required/);
});

test("audit sequence migration marks historical order and new events receive ordered numbers", async () => {
  const embedded = new PGlite();
  try {
    await embedded.exec("CREATE TABLE workspace_schema_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    for (const name of ["0001_init.sql", "0002_invitations.sql", "0003_rate_limits.sql", "0004_review_gates.sql"]) {
      const sql = await readFile(path.join(process.cwd(), "src", "workspace", "db", "migrations", name), "utf8");
      await embedded.exec(sql);
      await embedded.query("INSERT INTO workspace_schema_migrations(name, sha256) VALUES ($1, $2)", [name, createHash("sha256").update(sql).digest("hex")]);
    }
    await embedded.query("INSERT INTO workspace_users(id, email) VALUES ('u1', 'one@example.test')");
    await embedded.query("INSERT INTO organizations(id, name) VALUES ($1, 'Legacy org')", [orgA]);
    await embedded.query("INSERT INTO memberships(org_id, user_id, role, status) VALUES ($1, 'u1', 'owner', 'active')", [orgA]);
    await embedded.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, occurred_at) VALUES ($1, $2, 'u1', 'organization', $2::uuid::text, 'organization.created', '2026-01-01T00:00:00Z'), ($3, $2, 'u1', 'membership', 'u1', 'membership.joined', '2026-01-01T00:00:01Z')", ["dcb963c3-c0ee-4c79-a436-4321743ea1e9", orgA, "9670e8e1-4921-4fc7-8237-ddedb45eddec"]);
    await migrateWorkspace(embeddedWorkspaceDb(embedded));
    const historical = await embedded.query<{ org_seq: number; sequence_backfilled: boolean }>("SELECT org_seq, sequence_backfilled FROM audit_events WHERE org_id = $1 ORDER BY org_seq", [orgA]);
    assert.deepEqual(historical.rows.map((row) => [Number(row.org_seq), row.sequence_backfilled]), [[1, true], [2, true]]);
    await embedded.query("INSERT INTO audit_events(id, org_id, actor_id, object_type, object_id, action, org_seq, sequence_backfilled) VALUES ($1, $2, 'u1', 'membership', 'u1', 'membership.revoked', 99, true)", ["9ddfe9e6-c24d-4854-889d-27e94b6c43d4", orgA]);
    const fresh = await embedded.query<{ org_seq: number; sequence_backfilled: boolean }>("SELECT org_seq, sequence_backfilled FROM audit_events WHERE id = '9ddfe9e6-c24d-4854-889d-27e94b6c43d4'");
    assert.equal(Number(fresh.rows[0]?.org_seq), 3);
    assert.equal(fresh.rows[0]?.sequence_backfilled, false);
    await assert.rejects(embedded.query("UPDATE audit_events SET action = action WHERE org_id = $1", [orgA]));
  } finally { await embedded.close(); }
});
