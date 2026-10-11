import { books, hn, lastUpdated } from "@/lib/data";
import { NavLinks } from "./nav-links";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function Sidebar() {
  return (
    <aside className="border-b border-[var(--border)] bg-[var(--surface)] lg:border-r lg:border-b-0">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-5">
        <div>
          <p className="text-[15px] font-semibold tracking-tight">Market Radar</p>
          <p className="hidden text-xs text-[var(--muted)] lg:block">scraper v1.0 · internal</p>
        </div>
        <p className="text-xs text-[var(--ink-2)] lg:hidden">as of {fmt(lastUpdated().toISOString())} UTC</p>
      </div>
      <NavLinks />
      <div className="mt-auto hidden border-t border-[var(--border)] px-5 py-4 text-xs lg:block">
        <p className="mb-2 font-medium text-[var(--ink-2)]">Sources</p>
        <dl className="space-y-2">
          {[
            ["books.toscrape.com", books.meta.scraped_at, books.meta.count, "products"],
            ["news.ycombinator.com", hn.meta.scraped_at, hn.meta.count, "stories"],
          ].map(([name, at, n, unit]) => (
            <div key={name as string}>
              <dt className="font-mono text-[var(--ink)]">{name}</dt>
              <dd className="text-[var(--muted)]">{n} {unit} · {fmt(at as string)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[var(--muted)]">Runs every 6 h via GitHub Actions</p>
      </div>
      </div>
    </aside>
  );
}
