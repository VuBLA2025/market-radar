"use client";

import { useMemo, useState } from "react";
import type { Story } from "@/lib/data";
import { downloadCsv } from "@/components/csv";

type SortKey = "rank" | "points" | "comments";

export function NewsTable({ items }: { items: Story[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items
      .filter((s) => !n || s.title.toLowerCase().includes(n) || s.domain.toLowerCase().includes(n))
      .sort((a, b) => (sort === "rank" ? a.rank - b.rank : b[sort] - a[sort]));
  }, [items, q, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-72" placeholder="Search title or domain…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search stories" />
        <div className="flex overflow-hidden rounded-lg border border-[var(--border)] text-sm" role="group" aria-label="Sort by">
          {(["rank", "points", "comments"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              className={`h-8 px-3 capitalize ${sort === k ? "bg-[var(--accent-soft)] font-semibold text-[var(--ink)]" : "bg-[var(--surface)] text-[var(--ink-2)]"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <button className="btn sm:ml-auto" onClick={() => downloadCsv("hacker-news.csv", rows)}>↓ Export CSV</button>
      </div>

      <ol className="panel divide-y divide-[var(--border)]">
        {rows.map((s) => (
          <li key={s.id} className="flex gap-4 px-4 py-2.5">
            <span className="w-6 shrink-0 pt-0.5 text-right text-sm text-[var(--muted)] tabular-nums">{s.rank}</span>
            <div className="min-w-0 flex-1">
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.title}</a>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {s.domain}
                {s.author && <> · by {s.author}</>}
                {s.posted_at && <> · {new Date(`${s.posted_at}Z`).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })} UTC</>}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs leading-5 text-[var(--ink-2)] tabular-nums">
              <div className="font-mono"><span className="text-[var(--ink)]">{s.points}</span> pts</div>
              <div>{s.comments} comments</div>
            </div>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-10 text-center text-sm text-[var(--muted)]">No stories match.</li>}
      </ol>
    </div>
  );
}
