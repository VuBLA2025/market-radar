"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/data";
import { downloadCsv } from "@/components/csv";

type SortKey = "title" | "category" | "price" | "rating";
const PAGE = 25;

export function ProductsTable({ items, categories }: { items: Book[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "price", dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter(
        (b) =>
          (cat === "all" || b.category === cat) &&
          b.rating >= minRating &&
          (!stockOnly || b.in_stock) &&
          (!needle || b.title.toLowerCase().includes(needle)),
      )
      .sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key];
        return (typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv))) * sort.dir;
      });
  }, [items, q, cat, minRating, stockOnly, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const view = rows.slice(current * PAGE, current * PAGE + PAGE);
  const avg = rows.length ? rows.reduce((s, b) => s + b.price, 0) / rows.length : 0;
  const reset = (fn: () => void) => { fn(); setPage(0); };

  const header = (key: SortKey, label: string, align = "text-left") => (
    <th scope="col" className={`px-3 py-2 font-medium ${align}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "price" || key === "rating" ? -1 : 1 }))}
      >
        {label}
        <span className="text-[10px]">{sort.key === key ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters: one row above the content they scope */}
      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-64" placeholder="Search titles…" value={q} onChange={(e) => reset(() => setQ(e.target.value))} aria-label="Search titles" />
        <select className="field" value={cat} onChange={(e) => reset(() => setCat(e.target.value))} aria-label="Category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field" value={minRating} onChange={(e) => reset(() => setMinRating(+e.target.value))} aria-label="Minimum rating">
          <option value={0}>Any rating</option>
          {[2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}+ stars</option>)}
        </select>
        <label className="btn cursor-pointer">
          <input type="checkbox" checked={stockOnly} onChange={(e) => reset(() => setStockOnly(e.target.checked))} className="accent-[var(--series-1)]" />
          In stock only
        </label>
        <button className="btn disabled:opacity-40 sm:ml-auto" disabled={!rows.length} onClick={() => downloadCsv("products.csv", rows)}>
          ↓ Export CSV
        </button>
      </div>

      <p className="text-sm text-[var(--ink-2)]">
        <strong className="text-[var(--ink)]">{rows.length.toLocaleString()}</strong> products · average price{" "}
        <strong className="text-[var(--ink)]">£{avg.toFixed(2)}</strong>
      </p>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="border-b border-[var(--border)] text-xs text-[var(--ink-2)]">
            <tr>
              {header("title", "Product")}
              {header("category", "Category")}
              {header("rating", "Rating")}
              {header("price", "Price", "text-right")}
              <th scope="col" className="px-3 py-2 text-left font-medium">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {view.map((b) => (
              <tr key={b.id} className="hover:bg-[var(--accent-soft)]">
                <td className="max-w-[22rem] truncate px-3 py-2">
                  <a href={b.url} target="_blank" rel="noreferrer" className="hover:underline" title={b.title}>{b.title}</a>
                </td>
                <td className="px-3 py-2 text-[var(--ink-2)]">{b.category}</td>
                <td className="px-3 py-2 whitespace-nowrap" aria-label={`${b.rating} of 5 stars`}>
                  <span className="text-[var(--ink)]">{"★".repeat(b.rating)}</span>
                  <span className="text-[var(--grid)]">{"★".repeat(5 - b.rating)}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono">£{b.price.toFixed(2)}</td>
                <td className="px-3 py-2">
                  {b.in_stock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)]"><span className="size-1.5 rounded-full bg-[var(--good)]" />In stock</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]"><span className="size-1.5 rounded-full bg-[var(--muted)]" />Out of stock</span>
                  )}
                </td>
              </tr>
            ))}
            {!view.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">No products match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--ink-2)]">
        <span>Page {current + 1} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)}>← Prev</button>
          <button className="btn disabled:opacity-40" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
