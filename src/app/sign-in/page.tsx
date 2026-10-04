import { HumanSignInForm } from "./HumanSignInForm";
import { safeReturnPath } from "@/human/auth/session";

export const metadata = { title: "Sign in" };

export default async function HumanSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const nextPath = safeReturnPath(query.next);
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">Sign in</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">
        A verified email is required to start a Mission. Browsing Missions stays public.
      </p>
      <div className="mt-8">
        <HumanSignInForm nextPath={nextPath} />
      </div>
    </article>
  );
}
