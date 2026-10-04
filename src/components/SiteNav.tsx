import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/principles", label: "Principles" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/why-now", label: "Why Now" },
  { href: "/specification", label: "Specification" },
  { href: "/open-questions", label: "Open Questions" },
  { href: "https://mishys.com", label: "Mishys →", external: true },
];

export function SiteNav() {
  return (
    <header className="site-nav border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-[40rem] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--ink)]"
          style={{ color: "var(--ink)" }}
        >
          <Image
            src="/missionism_icon_vector.svg"
            alt=""
            width={22}
            height={23}
            className="h-5 w-auto"
            priority
          />
          <Image
            src="/missionism_wordmark_vector.svg"
            alt="Missionism"
            width={120}
            height={11}
            className="h-2.5 w-auto"
            priority
          />
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">
          {links.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
