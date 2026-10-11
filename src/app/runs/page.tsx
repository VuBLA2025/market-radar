import type { Metadata } from "next";
import { RunsTable } from "@/components/runs-table";
import { PageHeader, Panel } from "@/components/ui";
import { history } from "@/lib/data";

export const metadata: Metadata = { title: "Scrape runs" };

export default function RunsPage() {
  const runs = [...history.runs].reverse();
  return (
    <>
      <PageHeader title="Scrape runs">
        <p className="text-xs text-[var(--ink-2)]">{runs.length} runs kept · schedule <code className="font-mono">17 */6 * * *</code></p>
      </PageHeader>
      <Panel title="Run log" subtitle="One row per GitHub Actions run, newest first">
        <RunsTable runs={runs} />
      </Panel>
    </>
  );
}
