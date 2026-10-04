import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { MissionInputError, missionDraft, publicMissionUrl } from "@/missions/model";
import { createFormingMission } from "@/missions/store";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type MissionRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createMissionRequest(request: NextRequest, deps: MissionRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Mission request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  let draft;
  try {
    draft = missionDraft(body);
  } catch (error) {
    if (error instanceof MissionInputError) return rejected(400, error.message);
    throw error;
  }
  const mission = await createFormingMission(await deps.openDb(), identity, draft);
  const response = NextResponse.json({ url: publicMissionUrl(mission.slug) }, { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function POST(request: NextRequest) {
  return createMissionRequest(request, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  });
}
