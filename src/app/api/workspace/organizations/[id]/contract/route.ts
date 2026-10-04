import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { saveContractRevision } from "@/workspace/contracts";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: RouteContext<"/api/workspace/organizations/[id]/contract">) {
  const { identity, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!identity) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 10000);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }
  if (body.status !== "draft" && body.status !== "submitted") return NextResponse.json({ error: "Choose draft or submitted." }, { status: 400 });
  try {
    const saved = await saveContractRevision(await getWorkspaceDb(), id, identity.uid, Number(body.expectedRevision), body.status, body.answers);
    const response = NextResponse.json(saved, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "contracts.save");
  }
}
