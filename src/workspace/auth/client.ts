"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

export function workspaceClientAuth(): Auth {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) throw new Error("Workspace sign-in is not configured yet.");
  const app = getApps().some((candidate) => candidate.name === "missionism-workspace-client")
    ? getApp("missionism-workspace-client")
    : initializeApp({ projectId, apiKey, authDomain: `${projectId}.firebaseapp.com` }, "missionism-workspace-client");
  const auth = getAuth(app);
  const emulatorUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (emulatorUrl && !auth.emulatorConfig) connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  return auth;
}
