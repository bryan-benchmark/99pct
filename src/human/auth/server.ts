import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const appName = "pct99-human";
const invalidCodes = new Set(["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked", "auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/invalid-session-cookie", "auth/user-disabled", "auth/user-not-found"]);

export function isInvalidHumanCredential(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && invalidCodes.has(code);
}

function humanFirebaseApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("Human authentication is not configured.");
  const existing = getApps().find((app) => app.name === appName);
  if (existing) return existing;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return initializeApp({
    projectId,
    ...(serviceAccount ? { credential: cert(JSON.parse(serviceAccount)) } : {}),
  }, appName);
}

export function humanFirebaseAuth() {
  return getAuth(humanFirebaseApp());
}

export type HumanIdentity = { uid: string; email: string };

export async function verifyHumanSession(sessionCookie: string | undefined, auth?: Pick<Auth, "verifySessionCookie">): Promise<HumanIdentity | null> {
  if (!sessionCookie) return null;
  const verifier = auth ?? humanFirebaseAuth();
  try {
    const decoded = await verifier.verifySessionCookie(sessionCookie, true);
    if (!decoded.email || decoded.email_verified !== true) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    if (isInvalidHumanCredential(error)) return null;
    throw error;
  }
}
