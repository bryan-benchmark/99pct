import { NextResponse, type NextRequest } from "next/server";
import { humanFirebaseAuth, isInvalidHumanCredential } from "@/human/auth/server";
import { assertVerifiedRecentHumanLogin, humanCsrfAccepted, humanCsrfCookieName, humanSessionCookieName, humanSessionDurationMs } from "@/human/auth/session";
import { readWorkspaceJsonObject } from "@/workspace/http-body";

export const runtime = "nodejs";

function rejected(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return rejected(415, "Expected JSON.");
  const parsed = await readWorkspaceJsonObject(request, 12000);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Session request rejected.");
  if (typeof body.idToken !== "string" || body.idToken.length === 0 || body.idToken.length > 10000) return rejected(401, "Sign in first.");
  try {
    const auth = humanFirebaseAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    assertVerifiedRecentHumanLogin(decoded);
    const session = await auth.createSessionCookie(body.idToken, { expiresIn: humanSessionDurationMs });
    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(humanSessionCookieName, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: humanSessionDurationMs / 1000 });
    response.cookies.delete(humanCsrfCookieName);
    return response;
  } catch (error) {
    if (error instanceof Error && /Verify your email|Sign in again/.test(error.message)) return rejected(401, error.message);
    if (isInvalidHumanCredential(error)) return rejected(401, "Sign-in could not be verified.");
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = await readWorkspaceJsonObject(request, 1000);
  if (parsed.error) return rejected(403, "Session request rejected.");
  const body = parsed.body;
  if (!humanCsrfAccepted(request.headers.get("origin"), request.nextUrl.origin, request.cookies.get(humanCsrfCookieName)?.value, body.csrfToken)) return rejected(403, "Session request rejected.");
  const cookie = request.cookies.get(humanSessionCookieName)?.value;
  if (cookie) {
    try {
      const auth = humanFirebaseAuth();
      const decoded = await auth.verifySessionCookie(cookie, true);
      await auth.revokeRefreshTokens(decoded.uid);
    } catch (error) {
      if (!isInvalidHumanCredential(error)) throw error;
    }
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete(humanSessionCookieName);
  response.cookies.delete(humanCsrfCookieName);
  return response;
}
