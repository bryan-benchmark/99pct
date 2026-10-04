import { NextResponse, type NextRequest } from "next/server";
import { createSpark } from "@/sparks/store";
import { parseDraft } from "@/sparks/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Submit this form from the Spark page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  let draft;
  try {
    const body = await request.text();
    if (body.length > 5000) throw new Error("Proposal is too long.");
    draft = parseDraft(JSON.parse(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid proposal." }, { status: 400 });
  }
  try {
    const spark = await createSpark(draft);
    return NextResponse.json({ id: spark.id, url: `/sparks/${spark.id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this proposal." }, { status: 500 });
  }
}
