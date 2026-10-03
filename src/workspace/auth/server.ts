import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const invalidIdTokenCodes = new Set(["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked", "auth/user-disabled", "auth/user-not-found"]);
const invalidSessionCodes = new Set(["auth/argument-error", "auth/invalid-id-token", "auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/user-disabled", "auth/user-not-found"]);

export function isInvalidWorkspaceCredential(error: unknown, kind: "id_token" | "session") {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && (kind === "id_token" ? invalidIdTokenCodes : invalidSessionCodes).has(code);
}

function workspaceFirebaseApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is required for workspace authentication.");
  const existing = getApps().find((app) => app.name === "missionism-workspace");
  if (existing) return existing;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return initializeApp({
    projectId,
    ...(serviceAccount ? { credential: cert(JSON.parse(serviceAccount)) } : {}),
  }, "missionism-workspace");
}

export function workspaceFirebaseAuth() {
  return getAuth(workspaceFirebaseApp());
}

export async function verifyWorkspaceSession(sessionCookie: string | undefined) {
  if (!sessionCookie) return null;
  const auth = workspaceFirebaseAuth();
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    if (!decoded.email || decoded.email_verified !== true) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    if (isInvalidWorkspaceCredential(error, "session")) return null;
    throw error;
  }
}
