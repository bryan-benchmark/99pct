import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { WorkspaceError } from "./organizations";

export function recordWorkspaceFailure(operation: string, error: unknown) {
  const requestId = randomUUID();
  const rawCode = error && typeof error === "object" && "code" in error ? error.code : undefined;
  const code = typeof rawCode === "string" && /^[A-Z0-9]{5}$/.test(rawCode) ? rawCode : undefined;
  // Never log error.message, URLs, request bodies, tokens, email addresses, or SQL parameters.
  console.error(JSON.stringify({ component: "workspace", operation, status: 503, requestId, ...(code ? { code } : {}) }));
  return requestId;
}

export function workspaceApiError(error: unknown, operation: string) {
  if (error instanceof WorkspaceError) {
    const response = NextResponse.json({ error: error.message }, { status: error.status });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const requestId = recordWorkspaceFailure(operation, error);
  const response = NextResponse.json({ error: `Workspace is temporarily unavailable. Give support reference ${requestId}.`, requestId }, { status: 503 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Request-ID", requestId);
  return response;
}
