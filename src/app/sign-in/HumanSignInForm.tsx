"use client";

import { createUserWithEmailAndPassword, getIdToken, inMemoryPersistence, sendEmailVerification, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { humanClientAuth } from "@/human/auth/client";

export function HumanSignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const auth = humanClientAuth();
      await setPersistence(auth, inMemoryPersistence);
      if (mode === "create") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        await signOut(auth);
        form.reset();
        setMessage("Account created. Check your email to verify your address, then sign in.");
        setMode("sign-in");
        return;
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        setMessage("Verify your email before signing in. We sent another verification link.");
        return;
      }
      const csrfResponse = await fetch("/api/human/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("Could not start a secure session.");
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch("/api/human/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, idToken: await getIdToken(result.user, true) }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Could not start a secure session.");
      await signOut(auth);
      router.push(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full border border-[var(--line)] bg-white p-2";
  return (
    <div className="space-y-5 font-[family-name:var(--font-sans)] text-sm">
      <div className="flex gap-3">
        <button type="button" aria-pressed={mode === "sign-in"} onClick={() => setMode("sign-in")} className="border border-[var(--ink)] px-3 py-2">Sign in</button>
        <button type="button" aria-pressed={mode === "create"} onClick={() => setMode("create")} className="border border-[var(--ink)] px-3 py-2">Create account</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">Email<input type="email" name="email" required autoComplete="email" className={field} /></label>
        <label className="block">Password<input type="password" name="password" required minLength={6} autoComplete={mode === "create" ? "new-password" : "current-password"} className={field} /></label>
        <button type="submit" disabled={busy} className="border border-[var(--ink)] px-4 py-2 disabled:opacity-50">{busy ? "Working…" : mode === "create" ? "Create account" : "Sign in"}</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert" className="border border-red-700 p-3 text-red-700">{error}</p> : null}
    </div>
  );
}
