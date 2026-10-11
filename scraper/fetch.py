"""Polite HTTP client: retries with backoff, robots.txt + crawl-delay, rate limiting."""
from __future__ import annotations

import logging
import time
import urllib.robotparser
from urllib.parse import urljoin, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

log = logging.getLogger(__name__)

USER_AGENT = (
    "MarketRadarBot/1.0 (+https://github.com/your-username/market-radar; portfolio demo)"
)


class PoliteSession:
    def __init__(self, min_delay: float = 0.5, timeout: float = 20.0, respect_robots: bool = True):
        self.min_delay = min_delay
        self.timeout = timeout
        self.respect_robots = respect_robots
        self._last_request: dict[str, float] = {}
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}

        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en"})
        retry = Retry(
            total=4,
            backoff_factor=1.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
            respect_retry_after_header=True,
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    # -- robots.txt -------------------------------------------------------
    def _robots_for(self, url: str) -> urllib.robotparser.RobotFileParser | None:
        origin = "{0.scheme}://{0.netloc}".format(urlparse(url))
        if origin not in self._robots:
            parser = urllib.robotparser.RobotFileParser()
            try:
                resp = self.session.get(urljoin(origin, "/robots.txt"), timeout=self.timeout)
                if resp.status_code == 200:
                    parser.parse(resp.text.splitlines())
                    self._robots[origin] = parser
                else:
                    self._robots[origin] = None  # no robots.txt => allowed
            except requests.RequestException as exc:
                log.warning("Could not fetch robots.txt for %s: %s", origin, exc)
                self._robots[origin] = None
        return self._robots[origin]

    def delay_for(self, url: str) -> float:
        robots = self._robots_for(url) if self.respect_robots else None
        crawl_delay = robots.crawl_delay(USER_AGENT) if robots else None
        return max(self.min_delay, float(crawl_delay or 0))

    def allowed(self, url: str) -> bool:
        if not self.respect_robots:
            return True
        robots = self._robots_for(url)
        return True if robots is None else robots.can_fetch(USER_AGENT, url)

    # -- fetching ---------------------------------------------------------
    def get_html(self, url: str) -> str:
        if not self.allowed(url):
            raise PermissionError(f"robots.txt disallows {url}")
        host = urlparse(url).netloc
        wait = self.delay_for(url) - (time.monotonic() - self._last_request.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        log.debug("GET %s", url)
        resp = self.session.get(url, timeout=self.timeout)
        self._last_request[host] = time.monotonic()
        resp.raise_for_status()
        resp.encoding = resp.encoding if resp.encoding and resp.encoding.lower() != "iso-8859-1" else "utf-8"
        return resp.text
