import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { MissionInputError, projectDraft, publicProjectUrl } from "@/missions/model";
import { MissionAuthorizationError, MissionNotFoundError, createProject } from "@/missions/projects";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type ProjectRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createProjectRequest(request: NextRequest, missionSlug: string, deps: ProjectRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Project request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  let draft;
  try {
    draft = projectDraft(body);
  } catch (error) {
    if (error instanceof MissionInputError) return rejected(400, error.message);
    throw error;
  }
  try {
    const project = await createProject(await deps.openDb(), identity, missionSlug, draft);
    const response = NextResponse.json({ url: publicProjectUrl(project.missionSlug, project.slug) }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof MissionAuthorizationError) return rejected(403, error.message);
    if (error instanceof MissionNotFoundError) return rejected(404, error.message);
    throw error;
  }
}

export function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return context.params.then(({ slug }) => createProjectRequest(request, slug, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  }));
}
