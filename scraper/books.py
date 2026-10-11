"""Scraper for https://books.toscrape.com — a sandbox e-commerce catalogue.

Demonstrates the classic product-monitoring job: crawl every category,
follow pagination, normalise price / rating / stock, de-duplicate.
"""
from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .fetch import PoliteSession

log = logging.getLogger(__name__)

BASE_URL = "https://books.toscrape.com/"
RATINGS = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
_PRICE_RE = re.compile(r"(\d+(?:\.\d+)?)")


@dataclass
class Book:
    id: str
    title: str
    category: str
    price: float
    currency: str
    rating: int
    in_stock: bool
    url: str
    image: str

    def to_dict(self) -> dict:
        return asdict(self)


def parse_categories(html: str, page_url: str = BASE_URL) -> list[tuple[str, str]]:
    """Return [(category name, absolute url)] from the sidebar."""
    soup = BeautifulSoup(html, "html.parser")
    links = soup.select("div.side_categories ul.nav-list > li > ul > li > a")
    return [(a.get_text(strip=True), urljoin(page_url, a["href"])) for a in links]


def parse_price(text: str) -> float:
    match = _PRICE_RE.search(text.replace(",", ""))
    if not match:
        raise ValueError(f"No price in {text!r}")
    return float(match.group(1))


def parse_listing(html: str, page_url: str, category: str) -> tuple[list[Book], str | None]:
    """Parse one listing page. Returns (books, next_page_url | None)."""
    soup = BeautifulSoup(html, "html.parser")
    books: list[Book] = []
    for pod in soup.select("article.product_pod"):
        link = pod.select_one("h3 a")
        if link is None:
            continue
        url = urljoin(page_url, link["href"])
        rating_el = pod.select_one("p.star-rating")
        rating_word = next((c for c in (rating_el.get("class", []) if rating_el else []) if c in RATINGS), None)
        price_text = pod.select_one("p.price_color").get_text(strip=True)
        stock_el = pod.select_one("p.availability")
        img = pod.select_one("img")
        books.append(
            Book(
                id=url.rstrip("/").split("/")[-2] if url.endswith("index.html") else url,
                title=link.get("title") or link.get_text(strip=True),
                category=category,
                price=parse_price(price_text),
                currency="GBP",
                rating=RATINGS.get(rating_word or "", 0),
                in_stock=bool(stock_el and "in stock" in stock_el.get_text(" ", strip=True).lower()),
                url=url,
                image=urljoin(page_url, img["src"]) if img and img.get("src") else "",
            )
        )
    nxt = soup.select_one("ul.pager li.next a")
    return books, (urljoin(page_url, nxt["href"]) if nxt else None)


def scrape_books(session: PoliteSession, max_categories: int | None = None) -> list[dict]:
    home = session.get_html(BASE_URL)
    categories = parse_categories(home)
    if max_categories:
        categories = categories[:max_categories]
    log.info("Found %d categories", len(categories))

    seen: dict[str, Book] = {}
    for name, url in categories:
        page: str | None = url
        while page:
            items, page = parse_listing(session.get_html(page), page, name)
            for b in items:
                seen.setdefault(b.id, b)
        log.info("  %-22s total so far: %d", name, len(seen))
    return [b.to_dict() for b in seen.values()]
