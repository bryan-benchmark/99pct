import Link from "next/link";
import { protocolMeta } from "@/content/protocolMeta";
import { shortDefinition } from "@/content/voice";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[40rem] flex-col gap-2 px-5 py-8 font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
        <p>{shortDefinition}</p>
        <p>
          Missionism v{protocolMeta.version} · {protocolMeta.status} ·{" "}
          {protocolMeta.lastUpdated}
        </p>
        <p>
          The website explains.{" "}
          <code className="text-[var(--ink)]">/spec</code> is canonical.{" "}
          <Link href="/changes">Changes</Link>
          {" · "}
          <Link href="/why-now">Why now</Link>
          {" · "}
          <Link href="/specification">Specification</Link>
          {" · "}
          <Link href="/simulators/mission-spark">Spark prototype</Link>
          {" · "}
          <Link href="/demo/toolshare">Toolshare demo</Link>
          {" · "}
          <Link href="/demo/team-up">Team-Up demo</Link>
          {" · "}
          <Link href="/demo/experiments">Experiment demo</Link>
          {" · "}
          <Link href="/simulators/mission-units">MU simulator</Link>
          {" · "}
          <Link href="/simulators/mishys-launch">Mishys Launch</Link>
          {" · "}
          <a href="https://mishys.com">Mishys</a>
        </p>
      </div>
    </footer>
  );
}
