"""CLI entry point.

    python -m scraper                      # scrape everything into ./data
    python -m scraper --source books       # just the product catalogue
    python -m scraper --source hn --hn-pages 3
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path

from .books import BASE_URL as BOOKS_URL, scrape_books
from .fetch import PoliteSession
from .hackernews import BASE_URL as HN_URL, scrape_hn
from .notify import diff_alerts, send_telegram
from .storage import append_history, load_json, now_iso, save_dataset, summarize_books, summarize_hn


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="scraper", description="Market Radar data collector")
    ap.add_argument("--source", choices=["all", "books", "hn"], default="all")
    ap.add_argument("--out", type=Path, default=Path("data"))
    ap.add_argument("--hn-pages", type=int, default=2)
    ap.add_argument("--max-categories", type=int, default=None, help="limit categories (for quick tests)")
    ap.add_argument("--delay", type=float, default=0.5, help="minimum seconds between requests per host")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )
    log = logging.getLogger("scraper")
    session = PoliteSession(min_delay=args.delay)
    started, scraped_at = time.monotonic(), now_iso()
    run: dict = {"at": scraped_at}
    prev_books = load_json(args.out / "books.json", {})
    prev_hn = load_json(args.out / "hn.json", {})
    # Never alert on a diff against bundled sample data.
    old_books = [] if prev_books.get("meta", {}).get("sample") else prev_books.get("items", [])
    old_hn = [] if prev_hn.get("meta", {}).get("sample") else prev_hn.get("items", [])
    new_books, new_hn, failures = [], [], 0

    if args.source in ("all", "books"):
        try:
            new_books = scrape_books(session, args.max_categories)
            save_dataset(args.out, "books", BOOKS_URL, new_books, scraped_at)
            run["books"] = summarize_books(new_books)
            log.info("Books: %d products saved", len(new_books))
        except Exception:  # keep going so one broken source doesn't kill the run
            failures += 1
            log.exception("Books scrape failed")

    if args.source in ("all", "hn"):
        try:
            new_hn = scrape_hn(session, args.hn_pages)
            save_dataset(args.out, "hn", HN_URL, new_hn, scraped_at)
            run["hn"] = summarize_hn(new_hn)
            log.info("Hacker News: %d stories saved", len(new_hn))
        except Exception:
            failures += 1
            log.exception("HN scrape failed")

    if len(run) > 1:
        append_history(args.out, run)
        alerts = diff_alerts(old_books, new_books, old_hn, new_hn, int(os.getenv("HN_ALERT_POINTS", "300")))
        send_telegram(alerts)

    log.info("Done in %.1fs (%d failure(s))", time.monotonic() - started, failures)
    return 1 if failures and len(run) == 1 else 0


if __name__ == "__main__":
    sys.exit(main())
