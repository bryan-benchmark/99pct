import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { csrfCookieName } from "@/workspace/auth/session";

export const runtime = "nodejs";

export function GET() {
  const csrfToken = randomBytes(32).toString("hex");
  const response = NextResponse.json({ csrfToken });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(csrfCookieName, csrfToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 15 * 60 });
  return response;
}
