import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { csrfCookieName, sessionCookieName, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { createOrganization } from "@/workspace/organizations";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { identity, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!identity) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 1000);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }
  if (typeof body.name !== "string") return NextResponse.json({ error: "Enter an organization name." }, { status: 400 });
  try {
    const organization = await createOrganization(await getWorkspaceDb(), identity, body.name);
    const response = NextResponse.json({ organization }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "organizations.create");
  }
}
