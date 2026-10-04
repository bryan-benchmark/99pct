import { createHash } from "node:crypto";
import type { WorkspaceSql } from "./db/client";
import { WorkspaceError } from "./organizations";

const policies = {
  session_hour: { max: 30, interval: "1 hour", message: "Too many sign-in requests. Try again later." },
  organization_day: { max: 5, interval: "1 day", message: "Organization creation limit reached. Try again tomorrow." },
  invitation_day: { max: 30, interval: "1 day", message: "Invitation limit reached. Try again tomorrow." },
} as const;

export type WorkspaceRateScope = keyof typeof policies;

// A database upsert is atomic across app instances. This records successful business
// actions when called inside their transaction, and verified session exchanges.
export async function consumeWorkspaceRateLimit(db: WorkspaceSql, scope: WorkspaceRateScope, actorId: string) {
  if (!actorId || actorId.length > 128) throw new WorkspaceError(401, "A verified account is required.");
  const policy = policies[scope];
  const subjectHash = createHash("sha256").update(`${scope}:${actorId}`).digest("hex");
  const result = await db.query<{ attempts: number }>(
    `INSERT INTO workspace_rate_limits(scope, subject_hash, window_start, attempts)
     VALUES ($1, $2, date_bin($3::interval, now(), '1970-01-01 00:00:00+00'::timestamptz), 1)
     ON CONFLICT (scope, subject_hash, window_start) DO UPDATE
       SET attempts = workspace_rate_limits.attempts + 1
       WHERE workspace_rate_limits.attempts < $4
     RETURNING attempts`,
    [scope, subjectHash, policy.interval, policy.max],
  );
  if (!result.rows.length) throw new WorkspaceError(429, policy.message);
  return result.rows[0].attempts;
}
