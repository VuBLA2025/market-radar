from pathlib import Path

from scraper.books import parse_categories, parse_listing, parse_price
from scraper.hackernews import parse_front_page
from scraper.notify import diff_alerts
from scraper.storage import append_history, load_json, summarize_books, summarize_hn

FIX = Path(__file__).parent / "fixtures"
CAT_URL = "https://books.toscrape.com/catalogue/category/books/travel_2/index.html"


def read(name: str) -> str:
    return (FIX / name).read_text(encoding="utf-8")


def test_categories():
    cats = parse_categories(read("books_home.html"))
    assert cats == [
        ("Travel", "https://books.toscrape.com/catalogue/category/books/travel_2/index.html"),
        ("Mystery", "https://books.toscrape.com/catalogue/category/books/mystery_3/index.html"),
    ]


def test_listing_parses_products_and_pagination():
    books, nxt = parse_listing(read("books_listing.html"), CAT_URL, "Travel")
    assert len(books) == 2
    b = books[0]
    assert b.id == "its-only-the-himalayas_981"
    assert b.title == "It's Only the Himalayas"  # full title from the title attribute
    assert b.price == 45.17 and b.rating == 2 and b.in_stock is True
    assert b.url == "https://books.toscrape.com/catalogue/its-only-the-himalayas_981/index.html"
    assert b.image.startswith("https://books.toscrape.com/media/cache/")
    assert books[1].price == 49.43  # survives mojibake "Â£"
    assert books[1].in_stock is False and books[1].rating == 4
    assert nxt == "https://books.toscrape.com/catalogue/category/books/travel_2/page-2.html"


def test_parse_price_variants():
    assert parse_price("£1,234.50") == 1234.5
    assert parse_price("Â£9.99") == 9.99


def test_hn_front_page():
    stories = parse_front_page(read("hn_front.html"))
    assert [s.rank for s in stories] == [1, 2, 3]
    s = stories[0]
    assert s.id == "41000001" and s.domain == "example.com"
    assert s.points == 512 and s.comments == 231 and s.author == "alice"
    assert s.posted_at == "2026-10-10T07:12:44"
    ask = stories[1]
    assert ask.url == "https://news.ycombinator.com/item?id=41000002"
    assert ask.domain.startswith("news.ycombinator.com") and ask.comments == 0
    job = stories[2]
    assert job.points == 0 and job.author is None


def test_summaries_and_alerts():
    books = [{"id": "a", "title": "A", "price": 10.0, "in_stock": True, "rating": 5, "url": "u"},
             {"id": "b", "title": "B", "price": 20.0, "in_stock": False, "rating": 3, "url": "u"}]
    assert summarize_books(books) == {"count": 2, "avg_price": 15.0, "in_stock_pct": 50.0, "avg_rating": 4.0}
    hn = [{"id": "1", "title": "T", "url": "u", "domain": "x.com", "points": 400, "comments": 10}]
    assert summarize_hn(hn)["top_domain"] == "x.com"
    cheaper = [{**books[0], "price": 8.0}]
    alerts = diff_alerts(books, cheaper, [], hn, points_threshold=300)
    assert len(alerts) == 2 and "20.0%" in alerts[0]


def test_history_merges_split_source_runs(tmp_path):
    append_history(tmp_path, {"at": "2026-10-11T04:20:26+00:00", "books": {"count": 43}})
    append_history(tmp_path, {"at": "2026-10-11T04:20:34+00:00", "hn": {"count": 30}})
    append_history(tmp_path, {"at": "2026-10-11T10:20:00+00:00", "books": {"count": 50}})
    runs = load_json(tmp_path / "history.json", {})["runs"]
    assert len(runs) == 2
    assert runs[0]["books"]["count"] == 43 and runs[0]["hn"]["count"] == 30
