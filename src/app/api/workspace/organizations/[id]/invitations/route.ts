import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { createInvitation } from "@/workspace/invitations";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: RouteContext<"/api/workspace/organizations/[id]/invitations">) {
  const { identity: actor, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 1000);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if (typeof body.email !== "string" || (body.role !== "editor" && body.role !== "reviewer")) return NextResponse.json({ error: "Enter an email and choose a role." }, { status: 400 });
  try {
    const invitation = await createInvitation(await getWorkspaceDb(), id, actor.uid, body.email, body.role);
    const response = NextResponse.json({ invitation }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "invitations.create");
  }
}
