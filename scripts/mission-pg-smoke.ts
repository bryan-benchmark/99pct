import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { configuredMissionDb } from "../src/missions/db/client";
import { missionDatabaseUnavailable } from "../src/missions/db/config";
import { missionMigrationsCurrent } from "../src/missions/db/migrate";
import { expressInterest, getOwnInterest, listCreatorInterests } from "../src/missions/interest";
import { confirmParticipation, inviteInterest } from "../src/missions/participation";
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
    assert.equal(creatorView[0]?.state, "interested");
    await assert.rejects(() => inviteInterest(db, helper, created.slug, project.slug, work.slug, creatorView[0].id), /creator/);
    await assert.rejects(() => inviteInterest(db, creator, created.slug, project.slug, work.slug, randomUUID()), /not found/);
    assert.deepEqual(await inviteInterest(db, creator, created.slug, project.slug, work.slug, creatorView[0].id), { status: "invited" });
    await assert.rejects(() => inviteInterest(db, creator, created.slug, project.slug, work.slug, creatorView[0].id), /already/);
    assert.equal((await getOwnInterest(db, created.slug, project.slug, work.slug, helper.uid))?.state, "invited");
    const stranger = { uid: `other-uid-${suffix}`, email: `other-${suffix}@example.test` };
    await assert.rejects(() => confirmParticipation(db, creator, created.slug, project.slug, work.slug), /invitation/);
    await assert.rejects(() => confirmParticipation(db, stranger, created.slug, project.slug, work.slug), /invitation/);
    assert.deepEqual(await confirmParticipation(db, helper, created.slug, project.slug, work.slug), { status: "helping" });
    await assert.rejects(() => confirmParticipation(db, helper, created.slug, project.slug, work.slug), /already/);
    const second = { uid: `second-uid-${suffix}`, email: `second-${suffix}@example.test` };
    const secondNote = `second-note-${suffix}`;
    await expressInterest(db, second, created.slug, project.slug, work.slug, { note: secondNote, shareEmail: true });
    const both = await listCreatorInterests(db, created.slug, project.slug, work.slug, creator.uid);
    const secondInterest = both.find((row) => row.email === second.email);
    if (!secondInterest) throw new Error("Second interest was not visible to the creator.");
    await inviteInterest(db, creator, created.slug, project.slug, work.slug, secondInterest.id);
    await confirmParticipation(db, second, created.slug, project.slug, work.slug);
    const helping = await getPublicWork(db, created.slug, project.slug, work.slug);
    const ownHelping = await getOwnInterest(db, created.slug, project.slug, work.slug, helper.uid);
    const creatorHelping = await listCreatorInterests(db, created.slug, project.slug, work.slug, creator.uid);
    assert.equal(helping?.status, "open");
    assert.equal(helping?.interestCount, 2);
    assert.equal(helping?.helpingCount, 2);
    assert.equal(ownHelping?.state, "helping");
    assert.equal(JSON.stringify(ownHelping).includes(second.email), false);
    assert.equal(creatorHelping.every((row) => row.state === "helping"), true);
    const invitationIds = await db.query<{ id: string }>("SELECT id FROM work_invitations");
    const publicRecords = JSON.stringify({ listed, loaded, projects, projectLoaded, workItems, workLoaded, helping });
    assert.equal(publicRecords.includes(creator.email), false);
    assert.equal(publicRecords.includes(creator.uid), false);
    assert.equal(publicRecords.includes(helper.email), false);
    assert.equal(publicRecords.includes(helper.uid), false);
    assert.equal(publicRecords.includes(second.email), false);
    assert.equal(publicRecords.includes(second.uid), false);
    assert.equal(publicRecords.includes(note), false);
    assert.equal(publicRecords.includes(secondNote), false);
    for (const invitation of invitationIds.rows) assert.equal(publicRecords.includes(invitation.id), false);
    assert.equal(unrelated, null);
    assert.equal(own?.note, note);
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
    await assert.rejects(db.query("UPDATE work_invitations SET invited_by_uid = invited_by_uid"));
    await assert.rejects(db.query("DELETE FROM work_invitations"));
    await assert.rejects(db.query("UPDATE work_confirmations SET created_at = created_at"));
    await assert.rejects(db.query("DELETE FROM work_confirmations"));
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
