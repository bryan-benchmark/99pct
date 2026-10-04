import Link from "next/link";
import { DocStatus } from "@/components/DocStatus";
import { missionismHubCopy } from "@/content/99pct";
import { shortDefinition } from "@/content/voice";

export const metadata = { title: missionismHubCopy.title };

export default function MissionismPage() {
  return (
    <article className="mx-auto max-w-[40rem] px-5 py-12 md:py-16">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[var(--ink)]">{missionismHubCopy.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--body)] md:text-xl">{shortDefinition}</p>
      <p className="mt-6 text-[var(--body)]">{missionismHubCopy.relationship}</p>
      <DocStatus source="spec/canonical.json" sourceKind="canonical" />
      <p className="mt-8 font-[family-name:var(--font-sans)] text-sm leading-relaxed">
        {missionismHubCopy.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? " · " : null}
            <Link href={link.href}>{link.label}</Link>
          </span>
        ))}
      </p>
    </article>
  );
}
