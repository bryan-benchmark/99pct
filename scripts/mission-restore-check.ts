import assert from "node:assert/strict";
import { configuredMissionDb } from "../src/missions/db/client";
import { missionMigrationsCurrent } from "../src/missions/db/migrate";

const tables = ["mission_schema_migrations", "human_accounts", "missions", "mission_revisions", "mission_environment", "projects", "project_revisions", "work_items", "work_revisions", "work_interests", "work_invitations", "work_confirmations", "contributions", "contributor_refs", "contribution_recognitions", "contribution_bridge_outcomes", "contribution_anchors"] as const;

function dedicatedCheckUrl(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required.`);
  if (!new URL(value).pathname.slice(1).endsWith("_check")) throw new Error(`${name} must name a dedicated database ending in _check.`);
  return value;
}

async function main() {
  const sourceUrl = dedicatedCheckUrl(process.env.MISSION_TEST_DATABASE_URL, "MISSION_TEST_DATABASE_URL");
  const restoreUrl = dedicatedCheckUrl(process.env.MISSION_RESTORE_DATABASE_URL, "MISSION_RESTORE_DATABASE_URL");
  if (sourceUrl === restoreUrl) throw new Error("Source and restore databases must differ.");
  const source = configuredMissionDb(sourceUrl);
  const restored = configuredMissionDb(restoreUrl);
  try {
    const sourceDatabase = (await source.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    const restoredDatabase = (await restored.query<{ name: string }>("SELECT current_database() AS name")).rows[0]?.name;
    assert.notEqual(restoredDatabase, sourceDatabase);
    assert.equal(await missionMigrationsCurrent(source), true);
    assert.equal(await missionMigrationsCurrent(restored), true);
    for (const table of tables) {
      const before = await source.query(`SELECT * FROM ${table}`);
      const after = await restored.query(`SELECT * FROM ${table}`);
      const normalized = (rows: Record<string, unknown>[]) => rows.map((row) => JSON.stringify(row)).sort();
      assert.deepEqual(normalized(after.rows), normalized(before.rows), `${table} differs after restore`);
    }
    const revision = (await restored.query<{ mission_id: string }>("SELECT mission_id FROM mission_revisions LIMIT 1")).rows[0];
    const projectRevision = (await restored.query<{ project_id: string }>("SELECT project_id FROM project_revisions LIMIT 1")).rows[0];
    const workRevision = (await restored.query<{ work_id: string }>("SELECT work_id FROM work_revisions LIMIT 1")).rows[0];
    const interest = (await restored.query<{ id: string }>("SELECT id FROM work_interests LIMIT 1")).rows[0];
    const invitation = (await restored.query<{ id: string }>("SELECT id FROM work_invitations LIMIT 1")).rows[0];
    const confirmation = (await restored.query<{ invitation_id: string }>("SELECT invitation_id FROM work_confirmations LIMIT 1")).rows[0];
    const binding = (await restored.query<{ release_target: string }>("SELECT release_target FROM mission_environment WHERE singleton = 1")).rows[0];
    assert.ok(revision && projectRevision && workRevision && interest && invitation && confirmation && binding, "Restore drill needs Mission, Project, Work, interest, invitation, and confirmation records and an environment binding");
    await assert.rejects(restored.query("UPDATE mission_revisions SET name = name WHERE mission_id = $1", [revision.mission_id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM mission_revisions WHERE mission_id = $1", [revision.mission_id]), /append-only/);
    await assert.rejects(restored.query("UPDATE project_revisions SET title = title WHERE project_id = $1", [projectRevision.project_id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM project_revisions WHERE project_id = $1", [projectRevision.project_id]), /append-only/);
    await assert.rejects(restored.query("UPDATE work_revisions SET title = title WHERE work_id = $1", [workRevision.work_id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM work_revisions WHERE work_id = $1", [workRevision.work_id]), /append-only/);
    await assert.rejects(restored.query("UPDATE work_interests SET private_note = private_note WHERE id = $1", [interest.id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM work_interests WHERE id = $1", [interest.id]), /append-only/);
    await assert.rejects(restored.query("UPDATE work_invitations SET invited_by_uid = invited_by_uid WHERE id = $1", [invitation.id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM work_invitations WHERE id = $1", [invitation.id]), /append-only/);
    await assert.rejects(restored.query("UPDATE work_confirmations SET created_at = created_at WHERE invitation_id = $1", [confirmation.invitation_id]), /append-only/);
    await assert.rejects(restored.query("DELETE FROM work_confirmations WHERE invitation_id = $1", [confirmation.invitation_id]), /append-only/);
    process.stdout.write("Mission backup restore check passed.\n");
  } finally {
    await Promise.all([source.close(), restored.close()]);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission restore check failed."}\n`);
  process.exitCode = 1;
});
