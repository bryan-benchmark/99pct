import Link from "next/link";
import { productCopy } from "@/content/99pct";

const links = [
  { href: "/use", label: "Utilities" },
  { href: "/help", label: "Help" },
  { href: "/missions", label: "Missions" },
  { href: "/mcus", label: "MCUs" },
  { href: "/sign-in?mode=create&next=/use/rideshare-99", label: "Join" },
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
