"""Generate clearly-labelled SAMPLE data so the dashboard renders before the
first real scrape. The first GitHub Actions run overwrites these files.

    python scripts/make_sample_data.py
"""
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

rng = random.Random(42)
OUT = Path(__file__).resolve().parent.parent / "data"
NOW = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

CATEGORIES = ["Travel", "Mystery", "Historical Fiction", "Sequential Art", "Classics", "Philosophy",
              "Romance", "Womens Fiction", "Fiction", "Childrens", "Religion", "Nonfiction", "Music",
              "Science Fiction", "Sports and Games", "Fantasy", "New Adult", "Young Adult", "Science",
              "Poetry", "Paranormal", "Art", "Psychology", "Autobiography", "Parenting", "Adult Fiction",
              "Humor", "Horror", "History", "Food and Drink", "Christian Fiction", "Business", "Biography",
              "Thriller", "Contemporary", "Spirituality", "Academic", "Self Help", "Historical", "Christian",
              "Suspense", "Short Stories", "Novels", "Health", "Politics", "Cultural", "Crime"]
WEIGHTS = [rng.choice([3, 5, 8, 12, 20, 30, 60]) for _ in CATEGORIES]
ADJ = ["Silent", "Hidden", "Last", "Golden", "Broken", "Midnight", "Wild", "Little", "Secret", "Lost",
       "Crimson", "Quiet", "Endless", "Northern", "Paper", "Glass", "Distant", "Burning"]
NOUN = ["Harbor", "Garden", "Kingdom", "Letters", "River", "Atlas", "Orchard", "Machine", "Winter",
        "Lighthouse", "Compass", "Archive", "Season", "Mountain", "Library", "Promise", "Engine", "Shore"]

books = []
for i in range(1000):
    cat = rng.choices(CATEGORIES, WEIGHTS)[0]
    title = f"The {rng.choice(ADJ)} {rng.choice(NOUN)}" + (f": Book {rng.randint(2, 6)}" if rng.random() < 0.12 else "")
    books.append({
        "id": f"sample-book_{i}", "title": title, "category": cat,
        "price": round(rng.uniform(10, 60), 2), "currency": "GBP", "rating": rng.randint(1, 5),
        "in_stock": rng.random() > 0.04, "url": "https://books.toscrape.com/", "image": "",
    })

DOMAINS = ["github.com", "nytimes.com", "arstechnica.com", "theverge.com", "substack.com", "medium.com",
           "arxiv.org", "bloomberg.com", "youtube.com", "wikipedia.org", "news.ycombinator.com (Ask/Show HN)",
           "lwn.net", "quantamagazine.org", "economist.com", "nature.com"]
TOPICS = ["Postgres", "Rust", "SQLite", "WebAssembly", "LLM inference", "Linux 7.0", "Kubernetes", "Zig",
          "a tiny web server", "CRDTs", "home lab", "type systems", "solar batteries", "the C preprocessor"]
TEMPLATES = ["Show HN: I built {t} in a weekend", "Why {t} is eating the world", "Lessons from scaling {t}",
             "{t} is now 3x faster", "A deep dive into {t}", "Ask HN: Is {t} worth learning in 2026?",
             "The hidden cost of {t}", "How we cut our cloud bill with {t}"]
hn = []
for r in range(1, 61):
    pts = int(rng.paretovariate(1.2) * 25) + rng.randint(2, 30)
    d = rng.choices(DOMAINS, [8, 3, 3, 2, 4, 2, 3, 2, 2, 2, 6, 1, 1, 1, 1])[0]
    hn.append({
        "id": f"sample-{r}", "rank": r, "title": rng.choice(TEMPLATES).format(t=rng.choice(TOPICS)),
        "url": "https://news.ycombinator.com/", "domain": d, "points": min(pts, 1800),
        "comments": int(pts * rng.uniform(0.1, 0.9)), "author": f"user{rng.randint(10, 999)}",
        "posted_at": (NOW - timedelta(minutes=rng.randint(10, 1200))).isoformat()[:19],
    })
hn.sort(key=lambda s: -s["points"] * 0 + s["rank"])

runs = []
for k in range(28):
    at = NOW - timedelta(hours=6 * (27 - k))
    avg = round(95 + 30 * rng.random() + (k % 4) * 6, 1)
    runs.append({
        "at": at.isoformat(), "sample": True,
        "books": {"count": 1000, "avg_price": round(35.07 + rng.uniform(-0.4, 0.4), 2),
                  "in_stock_pct": round(95 + rng.uniform(-2, 2), 1), "avg_rating": 2.92},
        "hn": {"count": 60, "avg_points": avg, "max_points": int(avg * rng.uniform(5, 12)),
               "avg_comments": round(avg * 0.45, 1), "top_domain": "github.com"},
    })

meta = lambda src, n: {"source": src, "scraped_at": NOW.isoformat(), "count": n, "sample": True}
OUT.mkdir(exist_ok=True)
(OUT / "books.json").write_text(json.dumps({"meta": meta("https://books.toscrape.com/", len(books)), "items": books}, indent=1))
(OUT / "hn.json").write_text(json.dumps({"meta": meta("https://news.ycombinator.com/", len(hn)), "items": hn}, indent=1))
(OUT / "history.json").write_text(json.dumps({"runs": runs}, indent=1))
print(f"Wrote sample data: {len(books)} books, {len(hn)} stories, {len(runs)} history runs -> {OUT}")
