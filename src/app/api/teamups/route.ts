import { NextResponse, type NextRequest } from "next/server";
import { createTeamUp } from "@/teamups/store";
import { parseTeamUpDraft } from "@/teamups/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Use the Team-Up demo page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  let draft;
  try {
    const body = await request.text();
    if (body.length > 6500) throw new Error("Team-Up proposal is too long.");
    draft = parseTeamUpDraft(JSON.parse(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid proposal." }, { status: 400 });
  }
  try {
    const proposal = await createTeamUp(draft);
    return NextResponse.json({ url: `/demo/team-up/${proposal.id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this proposal." }, { status: 500 });
  }
}
