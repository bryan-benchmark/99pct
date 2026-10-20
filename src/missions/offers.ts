import { randomUUID } from "node:crypto";
import { helpKinds, utilityBySlug, utilitySlug, type HelpKind } from "@/content/utilities";
import type { MissionDb, MissionSql } from "./db/client";

export class OfferRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OfferRequestError";
    this.status = status;
  }
}

export type PublicOfferCount = { slug: string; count: number };
export type CreatorOffer = { id: string; kind: HelpKind; email: string; note: string };
export type OwnOffer = { kind: HelpKind; note: string };

const kinds = new Set<string>(helpKinds.map((kind) => kind.id));

export function offerDraft(input: Record<string, unknown>, slug: string) {
  const utility = utilityBySlug(slug);
  if (!utility) throw new OfferRequestError(404, "That utility was not found.");
  if (input.shareEmail !== true) throw new OfferRequestError(400, "Share your verified email before raising your hand.");
  if (typeof input.kind !== "string" || !kinds.has(input.kind)) throw new OfferRequestError(400, "Choose how you can help.");
  if (input.note !== undefined && input.note !== null && typeof input.note !== "string") throw new OfferRequestError(400, "Note must be text.");
  const note = typeof input.note === "string" ? input.note.trim().replace(/\s+/g, " ") : "";
  if (note.length > 240) throw new OfferRequestError(400, "Note must be at most 240 characters.");
  return { slug: utilitySlug(utility.name), kind: input.kind as HelpKind, note };
}

async function rememberHuman(tx: MissionSql, human: { uid: string; email: string }) {
  await tx.query(
    `INSERT INTO human_accounts (firebase_uid, verified_email) VALUES ($1, $2)
     ON CONFLICT (firebase_uid) DO UPDATE SET verified_email = EXCLUDED.verified_email`,
    [human.uid, human.email],
  );
}

export async function saveOffer(db: MissionDb, human: { uid: string; email: string }, draft: { slug: string; kind: HelpKind; note: string }) {
  await db.transaction(async (tx) => {
    await rememberHuman(tx, human);
    await tx.query(
      `INSERT INTO utility_offers (id, utility_slug, human_uid, kind, note, email_share_consented)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (utility_slug, human_uid) DO UPDATE SET kind = EXCLUDED.kind, note = EXCLUDED.note`,
      [randomUUID(), draft.slug, human.uid, draft.kind, draft.note],
    );
  });
  return { status: "offered" as const };
}

export async function listPublicOfferCounts(db: MissionDb): Promise<PublicOfferCount[]> {
  const result = await db.query<{ utility_slug: string; count: number }>(
    "SELECT utility_slug, count(*)::int AS count FROM utility_offers GROUP BY utility_slug",
  );
  return result.rows.map((row) => ({ slug: row.utility_slug, count: Number(row.count) }));
}

export async function listCreatorOffers(db: MissionDb, slug: string): Promise<CreatorOffer[]> {
  const result = await db.query<{ id: string; kind: HelpKind; verified_email: string; note: string }>(
    `SELECT utility_offers.id, utility_offers.kind, human_accounts.verified_email, utility_offers.note
     FROM utility_offers JOIN human_accounts ON human_accounts.firebase_uid = utility_offers.human_uid
     WHERE utility_offers.utility_slug = $1
     ORDER BY utility_offers.created_at ASC, utility_offers.id ASC`,
    [slug],
  );
  return result.rows.map((row) => ({ id: row.id, kind: row.kind, email: row.verified_email, note: row.note }));
}

export async function ownOffer(db: MissionDb, slug: string, uid: string): Promise<OwnOffer | null> {
  const result = await db.query<{ kind: HelpKind; note: string }>(
    "SELECT kind, note FROM utility_offers WHERE utility_slug = $1 AND human_uid = $2",
    [slug, uid],
  );
  return result.rows[0] ?? null;
}
