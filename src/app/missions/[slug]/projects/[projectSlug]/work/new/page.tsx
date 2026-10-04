import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { getMissionDb } from "@/missions/db/runtime";
import { workCopy } from "@/missions/model";
import { getPublicProject, viewerMayCreate } from "@/missions/projects";
import { SignOutButton } from "../../../../../new/SignOutButton";
import { PostWorkForm } from "./PostWorkForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post needed Work" };

export default async function PostWorkPage({ params }: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const { slug, projectSlug } = await params;
  const nextPath = `/missions/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectSlug)}/work/new`;
  const jar = await cookies();
  let identity: Awaited<ReturnType<typeof verifyHumanSession>> = null;
  try {
    identity = await verifyHumanSession(jar.get(humanSessionCookieName)?.value);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Human authentication is not configured.") throw error;
  }
  if (!identity) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  let allowed = false;
  try {
    const db = await getMissionDb();
    const project = await getPublicProject(db, slug, projectSlug);
    allowed = project !== null && await viewerMayCreate(db, slug, identity.uid);
  } catch (error) {
    if (error instanceof Error && error.message === "Mission database is not configured.") notFound();
    throw error;
  }
  if (!allowed) notFound();
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">Post needed Work</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">{workCopy.postingBoundary}</p>
      <PostWorkForm missionSlug={slug} projectSlug={projectSlug} />
      <SignOutButton />
    </article>
  );
}
