import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { humanCsrfCookieName } from "@/human/auth/session";

export const runtime = "nodejs";

export function GET() {
  const csrfToken = randomBytes(32).toString("hex");
  const response = NextResponse.json({ csrfToken });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(humanCsrfCookieName, csrfToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 15 * 60 });
  return response;
}
