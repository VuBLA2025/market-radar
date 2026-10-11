"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/news", label: "Hacker News" },
  { href: "/runs", label: "Scrape runs" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-0.5 lg:px-3 lg:pb-0" aria-label="Sections">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[4px] px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors ${active ? "bg-[var(--accent-soft)] font-medium text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--accent-soft)]/60 hover:text-[var(--ink)]"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
