import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const response = NextResponse.json({ status: "ready", service: "99pct" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
