import { NextResponse, type NextRequest } from "next/server";
import { verifyHumanSession, type HumanIdentity } from "@/human/auth/server";
import { humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName } from "@/human/auth/session";
import { submitContribution } from "@/missions/contributions";
import type { MissionDb } from "@/missions/db/client";
import { getMissionDb } from "@/missions/db/runtime";
import { InterestRequestError } from "@/missions/interest";
import { MissionInputError, contributionDraft } from "@/missions/model";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export type ContributionRequestDeps = {
  verifySession: (sessionCookie: string | undefined) => Promise<HumanIdentity | null>;
  openDb: () => Promise<MissionDb>;
};

export async function createContributionRequest(request: NextRequest, missionSlug: string, projectSlug: string, workSlug: string, deps: ContributionRequestDeps) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 8000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Contribution request rejected.");
  const identity = await deps.verifySession(request.cookies.get(humanSessionCookieName)?.value);
  if (!identity) return rejected(401, "Sign in with a verified email first.");
  try {
    const draft = contributionDraft(body);
    const recorded = await submitContribution(await deps.openDb(), identity, missionSlug, projectSlug, workSlug, draft);
    const response = NextResponse.json(recorded, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof MissionInputError) return rejected(400, error.message);
    if (error instanceof InterestRequestError) return rejected(error.status, error.message);
    throw error;
  }
}

export function POST(request: NextRequest, context: { params: Promise<{ slug: string; projectSlug: string; workSlug: string }> }) {
  return context.params.then(({ slug, projectSlug, workSlug }) => createContributionRequest(request, slug, projectSlug, workSlug, {
    verifySession: (sessionCookie) => verifyHumanSession(sessionCookie),
    openDb: () => getMissionDb(),
  }));
}
