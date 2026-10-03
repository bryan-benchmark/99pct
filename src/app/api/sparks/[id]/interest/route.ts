import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { addInterest } from "@/sparks/store";
import { parseInputs } from "@/sparks/types";

export const runtime = "nodejs";
const cookieName = "mission_spark_browser";

export async function POST(request: NextRequest, context: RouteContext<"/api/sparks/[id]/interest">) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Submit this form from the proposal page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  const { id } = await context.params;
  let inputs;
  try {
    const body = await request.text();
    if (body.length > 500) throw new Error("Response is too long.");
    inputs = parseInputs(JSON.parse(body).inputs, true);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid response." }, { status: 400 });
  }
  try {
    const existing = request.cookies.get(cookieName)?.value;
    const browserId = existing && /^[0-9a-f-]{36}$/i.test(existing) ? existing : randomUUID();
    const result = await addInterest(id, browserId, inputs);
    if (result === "missing") return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    if (result === "duplicate") return NextResponse.json({ error: "This browser has already responded to this proposal." }, { status: 409 });
    const response = NextResponse.json({ recorded: true }, { status: 201 });
    response.cookies.set(cookieName, browserId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not record this response." }, { status: 500 });
  }
}
