import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { acceptInvitation } from "@/workspace/invitations";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: RouteContext<"/api/workspace/invitations/[token]/accept">) {
  const { identity: actor, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 500);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const { token } = await params;
  try {
    const membership = await acceptInvitation(await getWorkspaceDb(), token, actor);
    const response = NextResponse.json({ membership }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "invitations.accept");
  }
}
