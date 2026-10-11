"""Writes scraped data to JSON (for the dashboard) and CSV (for humans / Excel)."""
from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

HISTORY_LIMIT = 240  # ~2 months at 4 runs/day


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(path)  # atomic


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def save_dataset(out_dir: Path, name: str, source: str, items: list[dict], scraped_at: str) -> dict:
    payload = {
        "meta": {"source": source, "scraped_at": scraped_at, "count": len(items), "sample": False},
        "items": items,
    }
    write_json(out_dir / f"{name}.json", payload)
    write_csv(out_dir / "export" / f"{name}.csv", items)
    return payload


def summarize_books(items: list[dict]) -> dict:
    if not items:
        return {}
    return {
        "count": len(items),
        "avg_price": round(mean(b["price"] for b in items), 2),
        "in_stock_pct": round(100 * sum(b["in_stock"] for b in items) / len(items), 1),
        "avg_rating": round(mean(b["rating"] for b in items), 2),
    }


def summarize_hn(items: list[dict]) -> dict:
    if not items:
        return {}
    domains = Counter(s["domain"] for s in items)
    return {
        "count": len(items),
        "avg_points": round(mean(s["points"] for s in items), 1),
        "max_points": max(s["points"] for s in items),
        "avg_comments": round(mean(s["comments"] for s in items), 1),
        "top_domain": domains.most_common(1)[0][0],
    }


MERGE_WINDOW_SECONDS = 15 * 60


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def append_history(out_dir: Path, run: dict) -> None:
    path = out_dir / "history.json"
    history = load_json(path, {"runs": []})
    # Drop sample runs once real data arrives.
    runs = [r for r in history.get("runs", []) if not r.get("sample")]
    last = runs[-1] if runs else None
    # `--source books` followed by `--source hn` a minute later is one logical
    # run: merge it instead of logging two half-empty rows.
    if (
        last
        and not (set(last) - {"at"}) & (set(run) - {"at"})
        and abs((_parse(run["at"]) - _parse(last["at"])).total_seconds()) <= MERGE_WINDOW_SECONDS
    ):
        last.update({k: v for k, v in run.items() if k != "at"})
    else:
        runs.append(run)
    write_json(path, {"runs": runs[-HISTORY_LIMIT:]})
