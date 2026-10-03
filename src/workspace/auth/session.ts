import type { DecodedIdToken } from "firebase-admin/auth";

export const sessionCookieName = "workspace_session";
export const csrfCookieName = "workspace_csrf";
export const sessionDurationMs = 12 * 60 * 60 * 1000;

export function validSameOriginCsrf(origin: string | null, expectedOrigin: string, cookieValue: string | undefined, submittedValue: unknown) {
  return origin === expectedOrigin && typeof cookieValue === "string" && cookieValue.length >= 32 && submittedValue === cookieValue;
}

export function assertVerifiedRecentLogin(token: Pick<DecodedIdToken, "email" | "email_verified" | "auth_time">, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!token.email || token.email_verified !== true) throw new Error("Verify your email before continuing.");
  if (typeof token.auth_time !== "number" || token.auth_time > nowSeconds + 60 || nowSeconds - token.auth_time > 5 * 60) {
    throw new Error("Sign in again before starting a workspace session.");
  }
}
