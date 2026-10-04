import Link from "next/link";
import { productCopy } from "@/content/99pct";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[40rem] flex-col gap-2 px-5 py-8 font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">
        <p>{productCopy.footerMark}</p>
        <p>{productCopy.footerTruth}</p>
        <p>
          <Link href="/missionism">Missionism</Link>
          {" · "}
          <Link href="/principles">Principles</Link>
          {" · "}
          <Link href="/specification">Specification</Link>
          {" · "}
          <Link href="/open-questions">Open Questions</Link>
          {" · "}
          <a href="https://github.com/bryan-benchmark/99pct">Source (AGPL-3.0)</a>
        </p>
      </div>
    </footer>
  );
}
