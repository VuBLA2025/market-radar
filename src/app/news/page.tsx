import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { hn } from "@/lib/data";
import { NewsTable } from "./news-table";

export const metadata: Metadata = { title: "Hacker News" };

export default function NewsPage() {
  return (
    <>
      <PageHeader title="Hacker News" />
      <NewsTable items={hn.items} />
    </>
  );
}
