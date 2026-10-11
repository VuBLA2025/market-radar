import Link from "next/link";
import { BarList, ColumnChart, LineChart } from "@/components/charts";
import { RunsTable } from "@/components/runs-table";
import { KpiStrip, PageHeader, Panel } from "@/components/ui";
import { bookStats, history, hnStats, lastUpdated } from "@/lib/data";

export default function Overview() {
  const b = bookStats();
  const h = hnStats();
  const hnSeries = history.runs.filter((r) => r.hn).map((r) => ({ t: r.at, value: r.hn!.avg_points }));
  const recent = [...history.runs].reverse().slice(0, 5);
  const asOf = lastUpdated().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  return (
    <>
      <PageHeader title="Overview">
        <p className="hidden text-xs text-[var(--ink-2)] lg:block">Data as of {asOf} UTC</p>
      </PageHeader>

      <div className="space-y-4">
        <KpiStrip
          items={[
            { label: "Products tracked", value: b.count.toLocaleString(), hint: `${b.categories} categories` },
            { label: "Avg price", value: `£${b.avgPrice.toFixed(2)}` },
            { label: "In stock", value: `${b.inStockPct.toFixed(1)}%` },
            { label: "HN stories", value: h.count.toString(), hint: "front pages 1–2" },
            { label: "Avg points", value: h.avgPoints.toFixed(0) },
            { label: "Avg comments", value: h.avgComments.toFixed(0) },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Price distribution" subtitle="Products per £5 band">
            <ColumnChart data={b.priceBins} ariaLabel="Histogram of product prices" unit=" products" height={200} />
          </Panel>
          <Panel title="Ratings" subtitle="Products by star rating">
            <ColumnChart data={b.ratings} ariaLabel="Products by star rating" unit=" products" height={200} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Avg price by category" subtitle="Top 10, categories with 3+ products" action={<Link href="/products" className="text-xs text-[var(--ink-2)] underline-offset-2 hover:underline">All products</Link>}>
            <BarList data={b.byCategory.slice(0, 10).map((c) => ({ ...c, detail: `${c.label}: ${c.n} products` }))} fmt="gbp" ariaLabel="Average price by category" />
          </Panel>
          <Panel title="HN stories by domain" subtitle="Latest scrape" action={<Link href="/news" className="text-xs text-[var(--ink-2)] underline-offset-2 hover:underline">All stories</Link>}>
            <BarList data={h.topDomains} ariaLabel="Stories by domain" />
          </Panel>
        </div>

        <Panel title="HN avg points per run" subtitle="Average score of front-page stories at each scrape">
          <LineChart data={hnSeries} seriesName="Avg points" fmt="fixed0" height={200} ariaLabel="Average Hacker News points per scrape over time" />
        </Panel>

        <Panel title="Recent runs" action={<Link href="/runs" className="text-xs text-[var(--ink-2)] underline-offset-2 hover:underline">Full log</Link>}>
          <RunsTable runs={recent} />
        </Panel>
      </div>
    </>
  );
}
