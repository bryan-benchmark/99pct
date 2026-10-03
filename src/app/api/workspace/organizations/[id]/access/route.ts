import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { revokeInvitation, revokeMember } from "@/workspace/invitations";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/workspace/organizations/[id]/access">) {
  const { identity: actor, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 500);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if (typeof body.targetId !== "string" || !body.targetId || (body.kind !== "member" && body.kind !== "invitation")) return NextResponse.json({ error: "Choose an access record." }, { status: 400 });
  try {
    const db = await getWorkspaceDb();
    if (body.kind === "member") await revokeMember(db, id, actor.uid, body.targetId);
    else {
      if (!idPattern.test(body.targetId)) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      await revokeInvitation(db, id, actor.uid, body.targetId);
    }
    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "access.revoke");
  }
}
