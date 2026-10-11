import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { books } from "@/lib/data";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  const categories = [...new Set(books.items.map((b) => b.category))].sort();
  return (
    <>
      <PageHeader title="Products" />
      <ProductsTable items={books.items} categories={categories} />
    </>
  );
}
