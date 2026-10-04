import Link from "next/link";
import { productCopy } from "@/content/99pct";

const links = [
  { href: "/use", label: "Use" },
  { href: "/work", label: "Build" },
  { href: "/missions", label: "Missions" },
  { href: "/missions/new", label: "Start" },
  { href: "/missionism", label: "Missionism" },
];

export function SiteNav() {
  return (
    <header className="site-nav border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-[40rem] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="99pct home" className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          {productCopy.mark}
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
