"""Scrape every registered provider and push the results to the frontend's
Convex deployment through its authenticated sync endpoint.

This reuses the scraper exactly as written: `scrape_url_all` for discovery
(active events only), then `normalize_record` + `HackathonCreate` to shape each
record the same way `HackathonCRUD.create_hackathon` does. Only the
destination differs: instead of the scraper's own `hackathons:create`
mutation, records go to `POST /api/hackathons/sync`, which upserts by URL.

Environment (never hardcode or print these):
  FRONTEND_SYNC_URL    e.g. https://<deployment>.convex.site/api/hackathons/sync
  SCRAPER_SYNC_TOKEN   must match the frontend deployment's SCRAPER_SYNC_TOKEN

Run from hackathon-scrapper/:
  python scripts/sync_to_frontend.py            # scrape and sync
  python scripts/sync_to_frontend.py --dry-run  # scrape only, send nothing
"""
import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.hackathon import HackathonCreate  # noqa: E402
from app.scrapers import PLATFORM_URLS, get_scraper, scrape_url_all  # noqa: E402
from app.utils.normalization import normalize_record  # noqa: E402

BATCH_SIZE = 100
logger = logging.getLogger("sync_to_frontend")


def to_payload(record: dict, listing_url: str) -> dict:
    """Same shaping as HackathonCRUD.create_hackathon."""
    normalized = normalize_record(record, listing_url)
    if "error" in normalized:
        raise ValueError(normalized["error"])
    data = HackathonCreate.model_validate(normalized).model_dump(mode="json", exclude_none=True)
    data["scraped_from"] = listing_url
    return data


def scrape_all():
    records, summary = {}, []
    for listing_url in PLATFORM_URLS:
        provider = get_scraper(listing_url).__class__.__name__.replace("Scraper", "")
        row = {"provider": provider, "status": "ok", "found": 0, "valid": 0, "error": None}
        try:
            results = scrape_url_all(listing_url)
            row["found"] = len(results)
            for result in results:
                try:
                    payload = to_payload(result, listing_url)
                except Exception as exc:  # one bad record should not sink the provider
                    logger.warning("Skipping invalid record from %s: %s", provider, exc)
                    continue
                records.setdefault(payload["url"], payload)
                row["valid"] += 1
            if not results:
                row["status"] = "empty"
        except Exception as exc:
            row["status"] = "failed"
            row["error"] = f"{type(exc).__name__}: {exc}"
        summary.append(row)
    return list(records.values()), summary


def push(records, sync_url: str, token: str):
    totals = {"inserted": 0, "updated": 0, "skipped": 0}
    for start in range(0, len(records), BATCH_SIZE):
        batch = records[start:start + BATCH_SIZE]
        response = requests.post(
            sync_url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            data=json.dumps({"hackathons": batch}),
            timeout=60,
        )
        if response.status_code != 200:
            # The endpoint only returns short error messages; never echo headers.
            raise RuntimeError(f"Sync failed with HTTP {response.status_code}: {response.text[:200]}")
        result = response.json()
        for key in totals:
            totals[key] += int(result.get(key, 0))
        print(f"  batch {start // BATCH_SIZE + 1}: {result}", flush=True)
    return totals


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="scrape only; do not send anything")
    args = parser.parse_args()
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")

    sync_url = os.getenv("FRONTEND_SYNC_URL", "").strip()
    token = os.getenv("SCRAPER_SYNC_TOKEN", "").strip()
    if not args.dry_run and (not sync_url or not token):
        sys.exit("FRONTEND_SYNC_URL and SCRAPER_SYNC_TOKEN must both be set (or use --dry-run).")

    started = time.time()
    records, summary = scrape_all()
    for row in summary:
        print(f"{row['provider']:<12} {row['status']:<7} found={row['found']:<4} valid={row['valid']:<4} "
              f"{row['error'] or ''}", flush=True)
    print(f"unique records to sync: {len(records)} (scraped in {time.time() - started:.0f}s)", flush=True)

    if args.dry_run:
        print("dry run: nothing sent")
        return
    totals = push(records, sync_url, token)
    print(f"sync complete: {totals}")


if __name__ == "__main__":
    main()
