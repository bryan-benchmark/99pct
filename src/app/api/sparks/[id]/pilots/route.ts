import { NextResponse, type NextRequest } from "next/server";
import { createPilotPlan } from "@/pilots/store";
import { parsePilotDraft } from "@/pilots/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: RouteContext<"/api/sparks/[id]/pilots">) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Submit this form from the pilot plan page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  const { id } = await context.params;
  let draft;
  try {
    const body = await request.text();
    if (body.length > 7000) throw new Error("Pilot plan is too long.");
    draft = parsePilotDraft(JSON.parse(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid pilot plan." }, { status: 400 });
  }
  try {
    const plan = await createPilotPlan(id, draft);
    if (!plan) return NextResponse.json({ error: "Spark not found." }, { status: 404 });
    return NextResponse.json({ url: `/sparks/${id}/pilots/${plan.id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this pilot plan." }, { status: 500 });
  }
}
