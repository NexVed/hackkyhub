from datetime import datetime, timezone
from app.utils.normalization import normalize_record
from app.scrapers.devfolio_scraper import DevfolioScraper
from app.scrapers.hackerearth_scraper import HackerEarthScraper
from app.scrapers.commudle_scraper import CommudleScraper
from app.scrapers.hackculture_scraper import HackCultureScraper
from typing import List, Dict, Any
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.devpost_scraper import DevpostScraper
from app.scrapers.mlh_scraper import MLHScraper
from app.scrapers.unstop_scraper import UnstopScraper
from app.scrapers.hack2skill_scraper import Hack2SkillScraper
from app.scrapers.devnovate_scraper import DevnovateScraper
from app.scrapers.custom_scraper import CustomScraper
import logging

logger = logging.getLogger(__name__)
ACTIVE_STATUSES = frozenset(("upcoming", "ongoing"))

# Register all scrapers (CustomScraper last — it handles any URL)
_scrapers: List[BaseScraper] = [
    DevpostScraper(),
    MLHScraper(),
    UnstopScraper(),
    Hack2SkillScraper(),
    DevnovateScraper(),
    DevfolioScraper(),
    HackerEarthScraper(),
    CommudleScraper(),
    HackCultureScraper(),
    CustomScraper(),
]

# Default listing URLs for each platform
PLATFORM_URLS = [
    "https://devpost.com/hackathons",
    f"https://mlh.io/seasons/{datetime.now(timezone.utc).year + (datetime.now(timezone.utc).month >= 7)}/events",
    "https://unstop.com/hackathons",
    "https://vision.hack2skill.com/hackathons-listing",
    "https://devnovate.co/events",
    "https://devfolio.co/hackathons",
    "https://www.hackerearth.com/challenges/hackathon/",
    "https://www.commudle.com/explore/hackathons",
    "https://hackculture.com/events",
]


def get_scraper(url: str) -> BaseScraper:
    """Get appropriate scraper for the URL"""
    for scraper in _scrapers:
        if scraper.can_handle(url):
            logger.info(f"Using {scraper.__class__.__name__} for {url}")
            return scraper

    logger.warning(f"No specific scraper found for {url}, using CustomScraper")
    return CustomScraper()


def _normalize_result(result: Dict[str, Any]) -> Dict[str, Any]:
    return normalize_record(result)


def scrape_url(url: str) -> Dict[str, Any]:
    """Scrape a single URL and return a single result dict"""
    scraper = get_scraper(url)
    result = scraper.scrape(url)
    return normalize_record(result, url)


def scrape_url_all(url: str) -> List[Dict[str, Any]]:
    """Scrape a listing URL and return ALL hackathons found (not just the first one)."""
    scraper = get_scraper(url)

    # For listing-page scrapers, call the internal method to get all results
    results = []

    if hasattr(scraper, '_scrape_listing_page_all'):
        raw = scraper._scrape_listing_page_all(url)
        if isinstance(raw, list):
            results = raw
        else:
            results = [raw]
    else:
        # Single-result scrapers
        raw = scraper.scrape(url)
        results = [raw]

    normalized = [normalize_record(r, url) for r in results if r and "error" not in r]
    # Listing discovery is intentionally active-only. A user can still paste a
    # completed event URL into /scrape for an explicit one-off lookup.
    active = [r for r in normalized if "error" not in r and r.get("status") in ACTIVE_STATUSES]
    skipped = len([r for r in normalized if "error" not in r]) - len(active)
    if skipped:
        logger.info("Skipped %s completed event(s) from %s", skipped, url)
    return active
