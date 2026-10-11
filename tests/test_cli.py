"""End-to-end run of the CLI with the network replaced by local fixtures."""
import json
from pathlib import Path

from scraper import __main__ as cli
from scraper.fetch import PoliteSession

FIX = Path(__file__).parent / "fixtures"
PAGES = {
    "https://books.toscrape.com/": "books_home.html",
    "https://books.toscrape.com/catalogue/category/books/travel_2/index.html": "books_listing.html",
    "https://books.toscrape.com/catalogue/category/books/mystery_3/index.html": "books_listing.html",
    "https://news.ycombinator.com/": "hn_front.html",
}


def fake_get_html(self, url):
    name = PAGES.get(url)
    if name is None:  # page-2.html etc. -> empty listing, no next link
        return "<html><body></body></html>"
    return (FIX / name).read_text(encoding="utf-8")


def test_cli_writes_json_csv_and_history(tmp_path, monkeypatch):
    monkeypatch.setattr(PoliteSession, "get_html", fake_get_html)
    assert cli.main(["--out", str(tmp_path), "--hn-pages", "1"]) == 0

    books = json.loads((tmp_path / "books.json").read_text())
    assert books["meta"]["count"] == 2  # de-duplicated across categories
    assert books["meta"]["sample"] is False
    hn = json.loads((tmp_path / "hn.json").read_text())
    assert hn["meta"]["count"] == 3
    history = json.loads((tmp_path / "history.json").read_text())
    assert history["runs"][-1]["books"]["count"] == 2
    assert (tmp_path / "export" / "books.csv").read_text().startswith("id,title,category")
