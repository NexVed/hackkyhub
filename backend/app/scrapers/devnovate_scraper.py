from urllib.parse import urlsplit, urljoin
from app.utils.normalization import belongs_to, parse_date, date_status, normalize_record
from app.scrapers.metadata import entity_name
from app.scrapers.custom_scraper import CustomScraper
from typing import Dict, Any, Optional, List
import re
from datetime import datetime
import logging
import requests as http_requests

from app.scrapers.base_scraper import BaseScraper
from app.models.hackathon import HackathonPlatform

logger = logging.getLogger(__name__)

# Devnovate public JSON API
DEVNOVATE_API_URL = "https://devnovate.co/api/v1/events"


class DevnovateScraper(BaseScraper):
    """Scraper for Devnovate events — uses their public JSON API."""

    def can_handle(self, url: str) -> bool:
        return belongs_to(url, "devnovate.co")

    def scrape(self, url: str) -> Dict[str, Any]:
        if urlsplit(url).path.rstrip("/") not in ("/events",):
            # Match the requested event exactly; SPA detail shells often only contain a brand title.
            target = urlsplit(url).path.rstrip("/")
            for event in self._scrape_listing_page_all("https://devnovate.co/events"):
                if urlsplit(event.get("url", "")).path.rstrip("/") == target:
                    return normalize_record(event, url)
            data = CustomScraper().scrape(url)
            if "error" not in data:
                data["platform"] = "devnovate"
            return normalize_record(data, url)
        logger.info(f"Scraping Devnovate URL: {url}")
        results = self._scrape_listing_page_all(url)
        if results:
            return results[0]
        return {"error": "No events found from Devnovate API"}

    def _scrape_listing_page_all(self, url: str) -> List[Dict[str, Any]]:
        if urlsplit(url).path.rstrip("/") not in ("/events",):
            return [self.scrape(url)]
        """Fetch ALL events from Devnovate's JSON API (single request — returns all)."""
        try:
            data = self._fetch_api()
            if not data:
                return []

            results = []
            for item in data:
                parsed = self._parse_api_item(item)
                if parsed:
                    results.append(parsed)

            logger.info(f"Devnovate API: fetched {len(results)} events")
            return results

        except Exception as e:
            logger.error(f"Error fetching Devnovate API: {e}")
            return []

    def _fetch_api(self) -> Optional[List[Dict]]:
        """Fetch all events from Devnovate's API (returns a flat array)."""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://devnovate.co/events",
            }
            resp = http_requests.get(DEVNOVATE_API_URL, headers=headers, timeout=15, allow_redirects=False)
            resp.raise_for_status()
            result = resp.json()
            # API returns a flat list of events
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "data" in result:
                return result["data"]
            return []
        except Exception as e:
            logger.error(f"Devnovate API request failed: {e}")
            return None

    def _parse_api_item(self, item: Dict) -> Optional[Dict[str, Any]]:
        """Parse a single event from the Devnovate API response."""
        if not item.get("name") or not item.get("hackathon"):
            return None
        try:
            name = item.get("name", "Unknown Event")

            # Build URL from hackathon slug
            slug = item.get("hackathon", "")
            url = f"https://devnovate.co/hackathon/{slug}" if slug else "https://devnovate.co/events"

            # Dates — Devnovate uses "DD-MM-YYYY" format
            start_date = self._parse_devnovate_date(item.get("startDate"))
            end_date = self._parse_devnovate_date(item.get("endDate"))

            # Registration deadline (ISO format)
            reg_deadline = self._parse_iso_date(item.get("registrationDeadline"))

            # Status / mode
            status_raw = str(item.get("status", "")).upper()
            if status_raw == "ONLINE":
                is_online = True
                location = "Online"
            elif status_raw == "OFFLINE":
                is_online = False
                location = "In Person"
            elif status_raw == "HYBRID":
                is_online = True
                location = "Hybrid"
            else:
                is_online = True
                location = "Online"

            # Themes
            themes = item.get("theme", [])
            if isinstance(themes, str):
                themes = [themes]
            themes = [t for t in themes if isinstance(t, str) and len(t) < 50]

            # Prize pool
            prizes = item.get("prizePool", "")

            # Organizer
            organizer = item.get("organizationName", "Devnovate")

            # Description
            description = item.get("description", "") or item.get("shortDescription", "") or item.get("subtitle", "")
            if description:
                description = re.sub(r'<[^>]+>', ' ', str(description))
                description = re.sub(r'\s+', ' ', description).strip()[:500]
            if not description:
                theme_str = ", ".join(themes[:3]) if themes else "hackathon"
                description = f"{name} - {theme_str} event by {organizer}"

            # Determine status from dates
            hack_status = self._determine_status(start_date, end_date)

            return normalize_record({
                "name": name,
                "description": description,
                "url": url,
                "platform": HackathonPlatform.DEVNOVATE,
                "banner_url": item.get("banner") or item.get("coverImage") or item.get("bannerImage") or item.get("cardImage"),
                "logo_url": item.get("logo") or item.get("organizationLogo"),
                "registration_deadline": reg_deadline,
                "registered_count": item.get("numberOfRegistrations"),
                "start_date": start_date,
                "end_date": end_date,
                "location": item.get("location") or location,
                "is_online": is_online,
                "prizes": str(prizes) if prizes else "",
                "themes": themes[:10],
                "organizer": organizer,
                "status": hack_status,
            })

        except Exception as e:
            logger.error(f"Error parsing Devnovate API item: {e}")
            return None

    def _parse_devnovate_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse DD-MM-YYYY format used by Devnovate."""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%d-%m-%Y")
        except (ValueError, TypeError):
            # Try ISO format as fallback
            return self._parse_iso_date(date_str)

    def _parse_iso_date(self, date_str):
        return parse_date(date_str)

    def _determine_status(self, start_date, end_date):
        return date_status(start_date, end_date)
