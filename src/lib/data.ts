import booksFile from "../../data/books.json";
import hnFile from "../../data/hn.json";
import historyFile from "../../data/history.json";

export type Book = {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  in_stock: boolean;
  url: string;
  image: string;
};

export type Story = {
  id: string;
  rank: number;
  title: string;
  url: string;
  domain: string;
  points: number;
  comments: number;
  author: string | null;
  posted_at: string | null;
};

export type Meta = { source: string; scraped_at: string; count: number; sample: boolean };

export type Run = {
  at: string;
  sample?: boolean;
  books?: { count: number; avg_price: number; in_stock_pct: number; avg_rating: number };
  hn?: { count: number; avg_points: number; max_points: number; avg_comments: number; top_domain: string };
};

export const books = booksFile as { meta: Meta; items: Book[] };
export const hn = hnFile as { meta: Meta; items: Story[] };
export const history = historyFile as { runs: Run[] };

export const isSample = books.meta.sample || hn.meta.sample;

export function lastUpdated() {
  const ts = [books.meta.scraped_at, hn.meta.scraped_at].sort().at(-1)!;
  return new Date(ts);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function bookStats() {
  const items = books.items;
  const cats = new Map<string, number[]>();
  for (const b of items) {
    if (!cats.has(b.category)) cats.set(b.category, []);
    cats.get(b.category)!.push(b.price);
  }
  const byCategory = [...cats.entries()]
    .filter(([, prices]) => prices.length >= 3)
    .map(([label, prices]) => ({ label, value: mean(prices), n: prices.length }))
    .sort((a, b) => b.value - a.value);

  const bins = Array.from({ length: 10 }, (_, i) => ({ lo: 10 + i * 5, hi: 15 + i * 5, value: 0 }));
  for (const b of items) {
    const i = Math.min(9, Math.max(0, Math.floor((b.price - 10) / 5)));
    bins[i].value++;
  }

  const ratings = [1, 2, 3, 4, 5].map((r) => ({
    label: "★".repeat(r),
    value: items.filter((b) => b.rating === r).length,
  }));

  return {
    count: items.length,
    avgPrice: mean(items.map((b) => b.price)),
    inStockPct: items.length ? (100 * items.filter((b) => b.in_stock).length) / items.length : 0,
    categories: cats.size,
    byCategory,
    priceBins: bins.map((b) => ({ label: `£${b.lo}`, value: b.value, detail: `£${b.lo}–£${b.hi}` })),
    ratings,
  };
}

export function hnStats() {
  const items = hn.items;
  const domains = new Map<string, number>();
  for (const s of items) domains.set(s.domain, (domains.get(s.domain) ?? 0) + 1);
  const topDomains = [...domains.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  return {
    count: items.length,
    avgPoints: mean(items.map((s) => s.points)),
    avgComments: mean(items.map((s) => s.comments)),
    top: [...items].sort((a, b) => b.points - a.points).slice(0, 5),
    topDomains,
  };
}
