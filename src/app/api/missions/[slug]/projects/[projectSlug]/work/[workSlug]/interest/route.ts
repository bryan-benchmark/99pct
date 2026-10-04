import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { InterestRequestError, expressInterest } from "@/missions/interest";
import { MissionInputError, interestDraft } from "@/missions/model";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type InterestRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createInterestRequest(request: NextRequest, missionSlug: string, projectSlug: string, workSlug: string, deps: InterestRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Interest request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  let draft;
  try {
    draft = interestDraft(body);
  } catch (error) {
    if (error instanceof MissionInputError) return rejected(400, error.message);
    throw error;
  }
  try {
    const interest = await expressInterest(await deps.openDb(), identity, missionSlug, projectSlug, workSlug, draft);
    const response = NextResponse.json(interest, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof InterestRequestError) return rejected(error.status, error.message);
    throw error;
  }
}

export function POST(request: NextRequest, context: { params: Promise<{ slug: string; projectSlug: string; workSlug: string }> }) {
  return context.params.then(({ slug, projectSlug, workSlug }) => createInterestRequest(request, slug, projectSlug, workSlug, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  }));
}
