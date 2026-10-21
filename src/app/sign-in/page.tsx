import type { Metadata } from "next";
import { HumanSignInForm } from "./HumanSignInForm";
import { safeReturnPath } from "@/human/auth/session";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ mode?: string }> }): Promise<Metadata> {
  const query = await searchParams;
  return { title: query.mode === "create" ? "Join" : "Sign in" };
}

function pieceFromReturn(nextPath: string) {
  const piece = new URLSearchParams((nextPath.split("#")[0] ?? "").split("?")[1] ?? "").get("piece") ?? "";
  if (piece.length < 2 || piece.length > 80 || /@|https?:|\/\//i.test(piece)) return "";
  return piece;
}

export default async function HumanSignInPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const query = await searchParams;
  const nextPath = safeReturnPath(query.next);
  const joining = query.mode === "create";
  const piece = pieceFromReturn(nextPath);
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{joining ? "Join" : "Sign in"}</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">
        {piece
          ? `You're here to do ${piece}. Use your email. Check it, then sign in. You come back to this piece.`
          : "Use your email. You can browse without an account. An account is how you start a utility or offer to help."}
      </p>
      <div className="mt-8">
        <HumanSignInForm nextPath={nextPath} piece={piece} initialMode={joining ? "create" : "sign-in"} />
      </div>
    </article>
  );
}
