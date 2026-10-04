import Link from "next/link";
import { findWorkCopy, productCopy } from "@/content/99pct";
import { getMissionDb } from "@/missions/db/runtime";
import { helpingCountLabel, interestCountLabel, publicWorkUrl } from "@/missions/model";
import { listOpenWork, type PublicOpenWork } from "@/missions/projects";

export const dynamic = "force-dynamic";
export const metadata = { title: findWorkCopy.title };

function workKind(kind: PublicOpenWork["kind"]) {
  return kind === "task" ? "Task" : "Role";
}

function postedAt(value: string) {
  return new Date(value).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}

export default async function FindWorkPage() {
  let work: PublicOpenWork[] = [];
  let unavailable = false;
  try {
    work = await listOpenWork(await getMissionDb());
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Mission database is not configured.") throw error;
    unavailable = true;
  }
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{findWorkCopy.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--body)]">{findWorkCopy.lede}</p>
      <p className="mt-4 text-[var(--muted)]">{findWorkCopy.boundary}</p>
      {unavailable ? <p className="mt-10 text-[var(--muted)]">Work is not available in this environment yet.</p> : null}
      {!unavailable && work.length === 0 ? (
        <div className="mt-10">
          <p className="text-[var(--muted)]">{findWorkCopy.empty}</p>
          <p className="mt-4 font-[family-name:var(--font-sans)]">
            <Link href={productCopy.start.href} className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">{productCopy.start.label}</Link>
          </p>
        </div>
      ) : null}
      <ul className="mt-10 space-y-8">
        {work.map((item) => (
          <li key={`${item.missionSlug}/${item.projectSlug}/${item.slug}`} className="border-t border-[var(--line)] pt-6">
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              <Link href={`/missions/${item.missionSlug}`}>{item.missionName}</Link>
              <span> · </span>
              <Link href={`/missions/${item.missionSlug}/projects/${item.projectSlug}`}>{item.projectTitle}</Link>
              <span> · {workKind(item.kind)}</span>
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
              <Link href={publicWorkUrl(item.missionSlug, item.projectSlug, item.slug)}>{item.title}</Link>
            </h2>
            <p className="mt-3 text-[var(--body)]">{item.description}</p>
            <p className="mt-3 text-[var(--body)]"><span className="font-semibold text-[var(--ink)]">Done when </span>{item.doneWhen}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {postedAt(item.createdAt)}
              {item.interestCount > 0 ? ` · ${interestCountLabel(item.interestCount)}` : ""}
              {item.helpingCount > 0 ? ` · ${helpingCountLabel(item.helpingCount)}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
