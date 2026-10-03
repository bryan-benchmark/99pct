import { NextResponse, type NextRequest } from "next/server";
import { isInvalidWorkspaceCredential, workspaceFirebaseAuth, verifyWorkspaceSession } from "@/workspace/auth/server";
import { assertVerifiedRecentLogin, csrfCookieName, sessionCookieName, sessionDurationMs, validSameOriginCsrf } from "@/workspace/auth/session";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { consumeWorkspaceRateLimit } from "@/workspace/rate-limit";
import { workspaceApiError } from "@/workspace/http-errors";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "Session request rejected." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const { body, error } = await readWorkspaceJsonObject(request, 12000);
  if (error) return error;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return forbidden();
  if (typeof body.idToken !== "string" || body.idToken.length > 10000) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let auth: ReturnType<typeof workspaceFirebaseAuth>;
  try { auth = workspaceFirebaseAuth(); }
  catch (error) { return workspaceApiError(error, "session.initialize"); }
  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(body.idToken, true);
    assertVerifiedRecentLogin(decoded);
    uid = decoded.uid;
  } catch (error) {
    if (error instanceof Error && /Verify your email|Sign in again/.test(error.message)) return NextResponse.json({ error: error.message }, { status: 401 });
    if (isInvalidWorkspaceCredential(error, "id_token")) return NextResponse.json({ error: "Sign-in could not be verified." }, { status: 401 });
    return workspaceApiError(error, "session.verify_id_token");
  }
  try {
    await consumeWorkspaceRateLimit(await getWorkspaceDb(), "session_hour", uid);
  } catch (error) {
    return workspaceApiError(error, "session.rate_limit");
  }
  try {
    const session = await auth.createSessionCookie(body.idToken, { expiresIn: sessionDurationMs });
    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(sessionCookieName, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: sessionDurationMs / 1000 });
    response.cookies.delete(csrfCookieName);
    return response;
  } catch (error) {
    return workspaceApiError(error, "session.create");
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = await readWorkspaceJsonObject(request, 1000);
  if (parsed.error) return forbidden();
  const body = parsed.body;
  if (!validSameOriginCsrf(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(csrfCookieName)?.value, body.csrfToken)) return forbidden();
  try {
    const identity = await verifyWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
    if (identity) await workspaceFirebaseAuth().revokeRefreshTokens(identity.uid);
  } catch (error) { return workspaceApiError(error, "session.sign_out"); }
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete(sessionCookieName);
  response.cookies.delete(csrfCookieName);
  return response;
}
