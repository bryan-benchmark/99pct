import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { reviewDecision } from "@/workspace/decisions";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: RouteContext<"/api/workspace/organizations/[id]/decisions/[decisionId]/reviews">) {
  const { identity: actor, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id, decisionId } = await params;
  if (!idPattern.test(id) || !idPattern.test(decisionId)) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 12000);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if ((body.disposition !== "approved" && body.disposition !== "rejected") || typeof body.reason !== "string") return NextResponse.json({ error: "Choose a disposition and explain why." }, { status: 400 });
  try {
    const review = await reviewDecision(await getWorkspaceDb(), id, decisionId, actor.uid, Number(body.revision), body.disposition, body.reason, body.gates);
    const response = NextResponse.json({ review }, { status: 201 });
    response.headers.set("Cache-Control", "no-store"); response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "decisions.review");
  }
}
