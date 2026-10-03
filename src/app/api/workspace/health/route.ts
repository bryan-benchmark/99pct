import { NextResponse } from "next/server";
import { getWorkspaceDb } from "@/workspace/db/runtime";
import { workspaceMigrationsCurrent } from "@/workspace/db/migrate";
import { recordWorkspaceFailure } from "@/workspace/http-errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) throw new Error("Authentication project is unconfigured.");
    const current = await workspaceMigrationsCurrent(await getWorkspaceDb());
    if (!current) throw new Error("Workspace migrations are not current.");
    const response = NextResponse.json({ status: "ready" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const requestId = recordWorkspaceFailure("health.check", error);
    const response = NextResponse.json({ status: "unavailable" }, { status: 503 });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Request-ID", requestId);
    return response;
  }
}
