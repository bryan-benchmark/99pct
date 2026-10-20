import { redirect } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { cookies } from "next/headers";
import { SignOutButton } from "./SignOutButton";
import { StartMissionForm } from "./StartMissionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Start a Mission" };

function clip(value: string | undefined, max: number) {
  return (value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

export default async function StartMissionPage({ searchParams }: { searchParams: Promise<{ name?: string; purpose?: string; beneficiaries?: string; startingPlace?: string }> }) {
  const query = await searchParams;
  const defaults = {
    name: clip(query.name, 80),
    purpose: clip(query.purpose, 500),
    beneficiaries: clip(query.beneficiaries, 160),
    startingPlace: clip(query.startingPlace, 80),
  };
  const jar = await cookies();
  let identity: Awaited<ReturnType<typeof verifyHumanSession>> = null;
  try {
    identity = await verifyHumanSession(jar.get(humanSessionCookieName)?.value);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
  }
  if (!identity) {
    const draft = new URLSearchParams();
    if (defaults.name) draft.set("name", defaults.name);
    if (defaults.purpose) draft.set("purpose", defaults.purpose);
    if (defaults.beneficiaries) draft.set("beneficiaries", defaults.beneficiaries);
    if (defaults.startingPlace) draft.set("startingPlace", defaults.startingPlace);
    const next = draft.size ? `/missions/new?${draft.toString()}` : "/missions/new";
    const signIn = new URLSearchParams({ next });
    if (defaults.name) signIn.set("mode", "create");
    redirect(`/sign-in?${signIn.toString()}`);
  }
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">Start a Mission</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">
        This creates a public forming Mission. It does not create a company, a contract, an ownership grant, or a fundraiser.
      </p>
      {defaults.name ? <p className="mt-4 text-[var(--body)]">This starts the community for {defaults.name}. The service itself is not live.</p> : null}
      <StartMissionForm key={defaults.name} defaults={defaults} />
      <SignOutButton />
    </article>
  );
}
