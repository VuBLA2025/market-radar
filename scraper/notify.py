"""Optional Telegram alerts: price drops and breakout HN stories.

Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (e.g. as GitHub Actions secrets)
to enable. Without them, alerts are just logged.
"""
from __future__ import annotations

import logging
import os

import requests

log = logging.getLogger(__name__)


def diff_alerts(old_books: list[dict], new_books: list[dict], old_hn: list[dict], new_hn: list[dict],
                points_threshold: int = 300) -> list[str]:
    alerts: list[str] = []
    old_prices = {b["id"]: b["price"] for b in old_books}
    for b in new_books:
        before = old_prices.get(b["id"])
        if before and b["price"] < before:
            pct = round(100 * (before - b["price"]) / before, 1)
            alerts.append(f"📉 Price drop {pct}%: {b['title']} £{before} → £{b['price']}\n{b['url']}")

    seen = {s["id"] for s in old_hn if s.get("points", 0) >= points_threshold}
    for s in new_hn:
        if s["points"] >= points_threshold and s["id"] not in seen:
            alerts.append(f"🔥 HN breakout ({s['points']} pts): {s['title']}\n{s['url']}")
    return alerts


def send_telegram(messages: list[str]) -> int:
    token, chat = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if not messages:
        return 0
    if not (token and chat):
        for m in messages:
            log.info("[alert] %s", m.replace("\n", " "))
        return 0
    sent = 0
    for m in messages[:10]:  # cap per run to avoid spam
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat, "text": m, "disable_web_page_preview": True},
            timeout=15,
        )
        sent += r.ok
    return sent
