import { redirect } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { cookies } from "next/headers";
import { SignOutButton } from "./SignOutButton";
import { StartMissionForm } from "./StartMissionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Start a Mission" };

export default async function StartMissionPage() {
  const jar = await cookies();
  let identity: Awaited<ReturnType<typeof verifyHumanSession>> = null;
  try {
    identity = await verifyHumanSession(jar.get(humanSessionCookieName)?.value);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
  }
  if (!identity) redirect("/sign-in?next=/missions/new");
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">Start a Mission</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">
        This creates a public forming Mission. It does not create a company, a contract, an ownership grant, or a fundraiser.
      </p>
      <StartMissionForm />
      <SignOutButton />
    </article>
  );
}
