import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { parseToolAction } from "@/toolshare/model";
import { applyToolAction, ToolshareError } from "@/toolshare/store";

export const runtime = "nodejs";
const cookieName = "toolshare_demo_browser";
const browserIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Use the Toolshare demo page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  let action;
  try {
    const body = await request.text();
    if (body.length > 300) throw new Error("Action is too long.");
    action = parseToolAction(JSON.parse(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid action." }, { status: 400 });
  }
  const existing = request.cookies.get(cookieName)?.value;
  const browserId = existing && browserIdPattern.test(existing) ? existing : action.type === "reserve" ? randomUUID() : null;
  if (!browserId) return NextResponse.json({ error: "Reservation not found for this browser." }, { status: 404 });

  try {
    const result = await applyToolAction(browserId, action);
    const response = NextResponse.json({ reservationId: result.reservationId });
    if (!existing && action.type === "reserve") {
      response.cookies.set(cookieName, browserId, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof ToolshareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not complete this demo action." }, { status: 500 });
  }
}
