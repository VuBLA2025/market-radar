import type { Run } from "@/lib/data";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function RunsTable({ runs }: { runs: Run[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[13px]">
        <thead className="text-left text-xs text-[var(--ink-2)]">
          <tr className="border-b border-[var(--border)]">
            <th className="py-2 pr-4 font-medium">Started (UTC)</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 text-right font-medium">Products</th>
            <th className="py-2 pr-4 text-right font-medium">Avg price</th>
            <th className="py-2 pr-4 text-right font-medium">In stock</th>
            <th className="py-2 pr-4 text-right font-medium">HN stories</th>
            <th className="py-2 pr-4 text-right font-medium">Avg points</th>
            <th className="py-2 font-medium">Top domain</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {runs.map((r) => {
            const ok = r.books && r.hn;
            return (
              <tr key={r.at} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.at)}</td>
                <td className="py-2 pr-4 font-sans">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${ok ? "bg-[var(--good)]" : "bg-[#d97706]"}`} aria-hidden />
                    {ok ? "ok" : "partial"}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right">{r.books?.count ?? "–"}</td>
                <td className="py-2 pr-4 text-right">{r.books ? `£${r.books.avg_price.toFixed(2)}` : "–"}</td>
                <td className="py-2 pr-4 text-right">{r.books ? `${r.books.in_stock_pct}%` : "–"}</td>
                <td className="py-2 pr-4 text-right">{r.hn?.count ?? "–"}</td>
                <td className="py-2 pr-4 text-right">{r.hn?.avg_points ?? "–"}</td>
                <td className="max-w-[180px] truncate py-2 text-[var(--ink-2)]">{r.hn?.top_domain ?? "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
