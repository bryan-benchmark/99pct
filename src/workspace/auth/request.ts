import type { NextResponse } from "next/server";
import { verifyWorkspaceSession } from "./server";
import { workspaceApiError } from "../http-errors";

export async function checkedWorkspaceSession(cookie: string | undefined): Promise<{ identity: Awaited<ReturnType<typeof verifyWorkspaceSession>>; failure: NextResponse | null }> {
  try { return { identity: await verifyWorkspaceSession(cookie), failure: null }; }
  catch (error) { return { identity: null, failure: workspaceApiError(error, "session.verify") }; }
}
