import type { Metadata } from "next";
import localFont from "next/font/local";
import { Sidebar } from "@/components/sidebar";
import { isSample } from "@/lib/data";
import "./globals.css";

const plexSans = localFont({
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-plex-sans",
});
const plexMono = localFont({
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: { default: "Market Radar", template: "%s · Market Radar" },
  description:
    "Scheduled Python scraper (GitHub Actions) and a Next.js dashboard for e-commerce prices and Hacker News activity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans lg:grid lg:grid-cols-[216px_1fr]">
        <Sidebar />
        <div className="min-w-0">
          {isSample && (
            <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-6 py-1.5 text-xs text-[var(--ink-2)]">
              Sample data. It gets replaced on the first scheduled scrape.
            </div>
          )}
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
