"""Scraper for the Hacker News front page (https://news.ycombinator.com).

HN's robots.txt asks for a crawl delay, which PoliteSession honours
automatically — so a 2-page scrape takes ~30s. That's the point: be polite.
"""
from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from .fetch import PoliteSession

log = logging.getLogger(__name__)

BASE_URL = "https://news.ycombinator.com/"
_INT_RE = re.compile(r"(\d+)")


@dataclass
class Story:
    id: str
    rank: int
    title: str
    url: str
    domain: str
    points: int
    comments: int
    author: str | None
    posted_at: str | None

    def to_dict(self) -> dict:
        return asdict(self)


def _int(text: str | None) -> int:
    m = _INT_RE.search((text or "").replace("\xa0", " "))
    return int(m.group(1)) if m else 0


def parse_front_page(html: str, page_url: str = BASE_URL) -> list[Story]:
    soup = BeautifulSoup(html, "html.parser")
    stories: list[Story] = []
    for row in soup.select("tr.athing"):
        title_a = row.select_one("span.titleline > a")
        if title_a is None:
            continue
        sub_row = row.find_next_sibling("tr")
        sub = sub_row.select_one("td.subtext") if sub_row else None

        href = urljoin(page_url, title_a.get("href", ""))
        domain = urlparse(href).netloc.removeprefix("www.")
        if domain == "news.ycombinator.com":
            domain = "news.ycombinator.com (Ask/Show HN)"

        comments = 0
        author = posted = None
        points = 0
        if sub:
            points = _int(getattr(sub.select_one("span.score"), "text", None))
            user = sub.select_one("a.hnuser")
            author = user.get_text(strip=True) if user else None
            age = sub.select_one("span.age")
            if age and age.get("title"):
                posted = age["title"].split(" ")[0]
            for a in sub.select("a"):
                label = a.get_text(" ", strip=True).replace("\xa0", " ")
                if "comment" in label:
                    comments = _int(label)

        stories.append(
            Story(
                id=row.get("id", ""),
                rank=_int(getattr(row.select_one("span.rank"), "text", None)),
                title=title_a.get_text(strip=True),
                url=href,
                domain=domain,
                points=points,
                comments=comments,
                author=author,
                posted_at=posted,
            )
        )
    return stories


def scrape_hn(session: PoliteSession, pages: int = 2) -> list[dict]:
    out: list[Story] = []
    for p in range(1, pages + 1):
        url = BASE_URL if p == 1 else f"{BASE_URL}?p={p}"
        page_stories = parse_front_page(session.get_html(url), url)
        log.info("HN page %d: %d stories", p, len(page_stories))
        out.extend(page_stories)
    return [s.to_dict() for s in out]
