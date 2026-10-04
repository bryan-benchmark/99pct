export const humanSessionCookieName = "human_session";
export const humanCsrfCookieName = "human_csrf";
export const humanSessionDurationMs = 12 * 60 * 60 * 1000;

const humanPublicOrigins = [
  "https://pct99--pct-99.us-central1.hosted.app",
  "https://99pct.com",
  "https://www.99pct.com",
];

export function humanOriginAllowed(origin: string | null, requestOrigin: string) {
  return origin === requestOrigin || (origin !== null && humanPublicOrigins.includes(origin));
}

export function humanCsrfAccepted(origin: string | null, requestOrigin: string, cookieValue: string | undefined, submittedValue: unknown) {
  return humanOriginAllowed(origin, requestOrigin) && typeof cookieValue === "string" && cookieValue.length >= 32 && submittedValue === cookieValue;
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return "/missions";
  return value;
}

export function assertVerifiedRecentHumanLogin(token: { email?: string; email_verified?: boolean; auth_time?: number }, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!token.email || token.email_verified !== true) throw new Error("Verify your email before continuing.");
  if (typeof token.auth_time !== "number" || token.auth_time > nowSeconds + 60 || nowSeconds - token.auth_time > 5 * 60) {
    throw new Error("Sign in again before starting a session.");
  }
}
