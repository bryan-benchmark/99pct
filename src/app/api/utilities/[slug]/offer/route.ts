import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { InterestRequestError } from "@/missions/interest";
import { openUtilityFromList, seatOfferOnStartedUtility } from "@/missions/growth";
import { OfferRequestError, offerDraft, saveOffer } from "@/missions/offers";
import { confirmParticipation } from "@/missions/participation";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type OfferRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createOfferRequest(request: NextRequest, slug: string, deps: OfferRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Offer request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  let draft;
  try {
    draft = offerDraft(body, slug);
  } catch (error) {
    if (error instanceof OfferRequestError) return rejected(error.status, error.message);
    throw error;
  }
  const db = await deps.openDb();
  const offer = await saveOffer(db, identity, draft);
  const next = await openUtilityFromList(db, identity, draft) ?? await seatOfferOnStartedUtility(db, identity, draft);
  const seated = next ? /^\/missions\/([^/]+)\/projects\/([^/]+)\/work\/([^/]+)$/.exec(next) : null;
  if (seated) {
    try {
      await confirmParticipation(db, identity, seated[1], seated[2], seated[3]);
    } catch (error) {
      if (!(error instanceof InterestRequestError) || error.status !== 409) throw error;
    }
  }
  const response = NextResponse.json(next ? { status: offer.status, next } : offer, { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return context.params.then(({ slug }) => createOfferRequest(request, slug, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  }));
}
