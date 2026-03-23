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

# Register all scrapers (CustomScraper last — it handles any URL)
_scrapers: List[BaseScraper] = [
    DevpostScraper(),
    MLHScraper(),
    UnstopScraper(),
    Hack2SkillScraper(),
    DevnovateScraper(),
    CustomScraper(),
]

# Default listing URLs for each platform
PLATFORM_URLS = [
    "https://devpost.com/hackathons",
    "https://mlh.io/seasons/2025/events",
    "https://unstop.com/hackathons",
    "https://vision.hack2skill.com/hackathons-listing",
    "https://devnovate.co/events",
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
    """Normalize scraper output — convert enums to strings, ensure required fields."""
    if "error" in result:
        return result

    # Convert HackathonPlatform enum to string
    platform = result.get("platform", "other")
    if hasattr(platform, "value"):
        result["platform"] = platform.value
    else:
        result["platform"] = str(platform)

    # Ensure required fields exist
    result.setdefault("name", "Unknown")
    result.setdefault("url", "")
    result.setdefault("is_online", False)
    result.setdefault("status", "upcoming")
    return result


def scrape_url(url: str) -> Dict[str, Any]:
    """Scrape a single URL and return a single result dict"""
    scraper = get_scraper(url)
    result = scraper.scrape(url)
    return _normalize_result(result)


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

    return [_normalize_result(r) for r in results if r and "error" not in r]