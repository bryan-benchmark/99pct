import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { missionMigrationsCurrent } from "../src/missions/db/migrate";
import { expressInterest, getOwnInterest, listCreatorInterests } from "../src/missions/interest";
import { createProject, createWork, getPublicProject, getPublicWork, listPublicProjects, listPublicWork } from "../src/missions/projects";
import { createFormingMission, getPublicMission, listPublicMissions } from "../src/missions/store";

async function main() {
  const connection = process.env.MISSION_RUNTIME_DATABASE_URL;
  if (!connection) throw new Error(missionDatabaseUnavailable);
  const databaseName = new URL(connection).pathname.slice(1);
  if (!databaseName.endsWith("mission_check")) throw new Error("The smoke test only runs against a database whose name ends with mission_check.");
  const db = configuredMissionDb(connection);
  try {
    if (!await missionMigrationsCurrent(db)) throw new Error("Mission migrations are not current.");
    const suffix = randomUUID().slice(0, 8);
    const creator = { uid: `private-uid-${suffix}`, email: `private-${suffix}@example.test` };
    const created = await createFormingMission(db, creator, {
      name: `Smoke ${suffix}`,
      purpose: "Prove the restricted Mission role can write.",
      beneficiaries: "The readiness check",
      startingPlace: "Global",
    });
    const refreshed = await createFormingMission(db, { ...creator, email: `refreshed-${suffix}@example.test` }, {
      name: `Smoke ${suffix}`,
      purpose: "Prove the restricted Mission role can write.",
      beneficiaries: "The readiness check",
      startingPlace: "Global",
    });
    assert.notEqual(refreshed.slug, created.slug);
    const listed = await listPublicMissions(db);
    const loaded = await getPublicMission(db, created.slug);
    const project = await createProject(db, creator, created.slug, {
      title: `Smoke project ${suffix}`,
      outcome: "The restricted role can record a Project.",
    });
    const work = await createWork(db, creator, created.slug, project.slug, {
      kind: "task",
      title: `Smoke task ${suffix}`,
      description: "The restricted role can record needed work.",
      doneWhen: "The smoke check prints that it passed.",
    });
    const helper = { uid: `helper-uid-${suffix}`, email: `helper-${suffix}@example.test` };
    const note = `private-note-${suffix}`;
    await expressInterest(db, helper, created.slug, project.slug, work.slug, { note, shareEmail: true });
    await assert.rejects(() => expressInterest(db, creator, created.slug, project.slug, work.slug, { note: "", shareEmail: true }), /creator/);
    await assert.rejects(() => expressInterest(db, helper, created.slug, project.slug, work.slug, { note: "again", shareEmail: true }), /already/);
    const projects = await listPublicProjects(db, created.slug);
    const projectLoaded = await getPublicProject(db, created.slug, project.slug);
    const workItems = await listPublicWork(db, created.slug, project.slug);
    const workLoaded = await getPublicWork(db, created.slug, project.slug, work.slug);
    const own = await getOwnInterest(db, created.slug, project.slug, work.slug, helper.uid);
    const unrelated = await getOwnInterest(db, created.slug, project.slug, work.slug, `other-uid-${suffix}`);
    const creatorView = await listCreatorInterests(db, created.slug, project.slug, work.slug, creator.uid);
    await assert.rejects(() => listCreatorInterests(db, created.slug, project.slug, work.slug, helper.uid), /creator/);
    assert.equal(workLoaded?.interestCount, 1);
    assert.equal(own?.note, note);
    assert.equal(unrelated, null);
    assert.equal(creatorView[0]?.email, helper.email);
    assert.equal(creatorView[0]?.note, note);
    const publicRecords = JSON.stringify({ listed, loaded, projects, projectLoaded, workItems, workLoaded });
    assert.equal(publicRecords.includes(creator.email), false);
    assert.equal(publicRecords.includes(creator.uid), false);
    assert.equal(publicRecords.includes(helper.email), false);
    assert.equal(publicRecords.includes(helper.uid), false);
    assert.equal(publicRecords.includes(note), false);
    assert.equal(loaded?.status, "forming");
    assert.equal(projectLoaded?.status, "active");
    assert.equal(workLoaded?.kind, "task");
    await assert.rejects(db.query("UPDATE mission_revisions SET name = name"));
    await assert.rejects(db.query("DELETE FROM mission_revisions"));
    await assert.rejects(db.query("UPDATE project_revisions SET title = title"));
    await assert.rejects(db.query("DELETE FROM project_revisions"));
    await assert.rejects(db.query("UPDATE work_revisions SET title = title"));
    await assert.rejects(db.query("DELETE FROM work_revisions"));
    await assert.rejects(db.query("UPDATE work_interests SET private_note = private_note"));
    await assert.rejects(db.query("DELETE FROM work_interests"));
    await assert.rejects(db.query("UPDATE missions SET status = status"));
    await assert.rejects(db.query("DELETE FROM missions"));
    await assert.rejects(db.query("INSERT INTO mission_schema_migrations (name, sha256) VALUES ('blocked', 'blocked')"));
    await assert.rejects(db.query("DROP TABLE missions"));
    process.stdout.write("Mission PostgreSQL smoke passed.\n");
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Mission smoke check failed."}\n`);
  process.exitCode = 1;
});
