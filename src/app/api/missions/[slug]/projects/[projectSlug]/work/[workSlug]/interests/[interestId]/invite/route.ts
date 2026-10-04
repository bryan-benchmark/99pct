import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { InterestRequestError } from "@/missions/interest";
import { inviteInterest } from "@/missions/participation";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

const interestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type InviteRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createInviteRequest(request: NextRequest, missionSlug: string, projectSlug: string, workSlug: string, interestId: string, deps: InviteRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Invitation request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  if (!interestIdPattern.test(interestId)) return rejected(404, "That interest was not found.");
  try {
    const invitation = await inviteInterest(await deps.openDb(), identity, missionSlug, projectSlug, workSlug, interestId);
    const response = NextResponse.json(invitation, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof InterestRequestError) return rejected(error.status, error.message);
    throw error;
  }
}

export function POST(request: NextRequest, context: { params: Promise<{ slug: string; projectSlug: string; workSlug: string; interestId: string }> }) {
  return context.params.then(({ slug, projectSlug, workSlug, interestId }) => createInviteRequest(request, slug, projectSlug, workSlug, interestId, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  }));
}
