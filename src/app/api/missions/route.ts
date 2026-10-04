import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession } from "@/human/auth/server";
import { humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { MissionInputError, missionDraft, publicMissionUrl } from "@/missions/model";
import { createFormingMission } from "@/missions/store";
import { validSameOriginCsrf } from "@/workspace/auth/session";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Mission request rejected.");
  const identity = await verifyHumanSession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  try {
    const mission = await createFormingMission(await getMissionDb(), identity, missionDraft(body));
    const response = NextResponse.json({ url: publicMissionUrl(mission.slug) }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof MissionInputError) return rejected(400, error.message);
    throw error;
  }
}
