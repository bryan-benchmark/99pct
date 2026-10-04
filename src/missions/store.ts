import { randomUUID } from "node:crypto";
import type { MissionDb } from "./db/client";
import { missionSlugBase, type MissionDraft, type PublicMission } from "./model";

type RevisionRow = {
  slug: string;
  status: "forming";
  created_at: Date | string;
  name: string;
  purpose: string;
  beneficiaries: string;
  starting_place: string;
  verified_email?: string;
};

const publicSelect = `
  SELECT missions.slug, missions.status, missions.created_at, revisions.name, revisions.purpose, revisions.beneficiaries, revisions.starting_place
  FROM missions
  JOIN mission_revisions revisions ON revisions.mission_id = missions.id
  JOIN (
    SELECT mission_id, MAX(revision) AS revision FROM mission_revisions GROUP BY mission_id
  ) latest ON latest.mission_id = revisions.mission_id AND latest.revision = revisions.revision
`;

function published(row: RevisionRow): PublicMission {
  return {
    slug: row.slug,
    status: "forming",
    name: row.name,
    purpose: row.purpose,
    beneficiaries: row.beneficiaries,
    startingPlace: row.starting_place,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createFormingMission(db: MissionDb, creator: { uid: string; email: string }, draft: MissionDraft): Promise<PublicMission> {
  return db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)
       ON CONFLICT (firebase_uid) DO UPDATE SET verified_email = EXCLUDED.verified_email`,
      [creator.uid, creator.email],
    );
    const base = missionSlugBase(draft.name);
    let slug = "";
    for (let suffix = 0; suffix < 50; suffix += 1) {
      const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`.slice(0, 60);
      const existing = await tx.query<{ slug: string }>("SELECT slug FROM missions WHERE slug = $1", [candidate]);
      if (existing.rows.length === 0) {
        slug = candidate;
        break;
      }
    }
    if (!slug) throw new Error("A readable slug could not be reserved.");
    const id = randomUUID();
    await tx.query(
      "INSERT INTO missions (id, slug, creator_uid, status) VALUES ($1, $2, $3, 'forming')",
      [id, slug, creator.uid],
    );
    await tx.query(
      `INSERT INTO mission_revisions (mission_id, revision, author_uid, name, purpose, beneficiaries, starting_place)
       VALUES ($1, 1, $2, $3, $4, $5, $6)`,
      [id, creator.uid, draft.name, draft.purpose, draft.beneficiaries, draft.startingPlace],
    );
    const saved = await tx.query<RevisionRow>(`${publicSelect} WHERE missions.id = $1`, [id]);
    return published(saved.rows[0]);
  });
}

export async function listPublicMissions(db: MissionDb): Promise<PublicMission[]> {
  const result = await db.query<RevisionRow>(`${publicSelect} ORDER BY missions.created_at DESC, missions.slug ASC`);
  return result.rows.map(published);
}

export async function getPublicMission(db: MissionDb, slug: string): Promise<PublicMission | null> {
  const result = await db.query<RevisionRow>(`${publicSelect} WHERE missions.slug = $1`, [slug]);
  return result.rows[0] ? published(result.rows[0]) : null;
}
