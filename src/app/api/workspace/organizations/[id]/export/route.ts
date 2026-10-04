import { NextResponse, type NextRequest } from "next/server";
import { checkedWorkspaceSession } from "@/workspace/auth/request";
import { sessionCookieName } from "@/workspace/auth/session";
import { exportOrganizationRecord } from "@/workspace/audit";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { workspaceApiError } from "@/workspace/http-errors";

export const runtime = "nodejs";
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: RouteContext<"/api/workspace/organizations/[id]/export">) {
  const { identity: actor, failure } = await checkedWorkspaceSession(request.cookies.get(sessionCookieName)?.value);
  if (failure) return failure;
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  try {
    const record = await exportOrganizationRecord(await getWorkspaceDb(), id, actor.uid);
    return new Response(JSON.stringify(record, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="mission-workspace-${id}.json"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return workspaceApiError(error, "audit.export");
  }
}
