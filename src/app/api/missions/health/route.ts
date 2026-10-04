import { NextResponse } from "next/server";
import { parseMissionProductionConfig } from "@/missions/db/config";
import { missionMigrationsCurrent } from "@/missions/db/migrate";
import { getMissionDb } from "@/missions/db/runtime";
import { assertMissionEnvironment } from "@/missions/environment";

export const runtime = "nodejs";

export async function missionHealthResponse(inspect: () => Promise<void>) {
  try {
    await inspect();
    const response = NextResponse.json({ status: "ready" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.json({ status: "unavailable" }, { status: 503 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export function GET() {
  return missionHealthResponse(async () => {
    const db = await getMissionDb();
    if (!await missionMigrationsCurrent(db)) throw new Error("Mission database is not configured.");
    await assertMissionEnvironment(db, parseMissionProductionConfig(process.env));
  });
}
