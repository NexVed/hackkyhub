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

# Hack2Skill public JSON API
HACK2SKILL_API_URL = "https://vision.hack2skill.com/api/v1/innovator/public/event/public-list"


class Hack2SkillScraper(BaseScraper):
    """Scraper for Hack2Skill hackathons — uses their public JSON API."""

    def can_handle(self, url: str) -> bool:
        return belongs_to(url, "hack2skill.com")

    def scrape(self, url: str) -> Dict[str, Any]:
        if urlsplit(url).path.rstrip("/") not in ("/hackathons", "/hackathons-listing"):
            # Match the requested event exactly; SPA detail shells often only contain a brand title.
            target = urlsplit(url).path.rstrip("/")
            for event in self._scrape_listing_page_all("https://vision.hack2skill.com/hackathons-listing"):
                if urlsplit(event.get("url", "")).path.rstrip("/") == target:
                    return normalize_record(event, url)
            data = CustomScraper().scrape(url)
            if "error" not in data:
                data["platform"] = "hack2skill"
            return normalize_record(data, url)
        logger.info(f"Scraping Hack2Skill URL: {url}")
        results = self._scrape_listing_page_all(url)
        if results:
            return results[0]
        return {"error": "No hackathons found from Hack2Skill API"}

    def _scrape_listing_page_all(self, url: str) -> List[Dict[str, Any]]:
        if urlsplit(url).path.rstrip("/") not in ("/hackathons", "/hackathons-listing"):
            return [self.scrape(url)]
        """Fetch ALL hackathons from Hack2Skill's JSON API (multiple pages)."""
        all_hackathons = []
        page = 1
        max_pages = 10  # Up to 10 pages (90 hackathons)

        while page <= max_pages:
            try:
                data = self._fetch_api_page(page)
                if not data or not data.get("success"):
                    break

                items = data.get("data", [])
                if not items:
                    break

                for item in items:
                    parsed = self._parse_api_item(item)
                    if parsed:
                        all_hackathons.append(parsed)

                total_pages = data.get("pages", 1)
                if page >= total_pages:
                    break

                page += 1

            except Exception as e:
                logger.error(f"Error fetching Hack2Skill API page {page}: {e}")
                break

        logger.info(f"Hack2Skill API: fetched {len(all_hackathons)} hackathons from {page} pages")
        return all_hackathons

    def _fetch_api_page(self, page: int = 1, records: int = 15) -> Optional[Dict]:
        """Fetch a single page from Hack2Skill's API."""
        try:
            now = datetime.utcnow()
            params = {
                "page": page,
                "records": records,
                "start": "2024-01-01T00:00:00.000Z",
                "end": f"{now.year + 1}-12-31T23:59:59.999Z",
            }
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://hack2skill.com/hackathons",
            }
            resp = http_requests.get(HACK2SKILL_API_URL, params=params, headers=headers, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Hack2Skill API request failed: {e}")
            return None

    def _parse_api_item(self, item: Dict) -> Optional[Dict[str, Any]]:
        """Parse a single hackathon from the Hack2Skill API response."""
        if not item.get("title") or not item.get("eventUrl"):
            return None
        try:
            title = item.get("title", "Unknown Hackathon")

            # Build URL from eventUrl slug
            event_slug = item.get("eventUrl", "")
            url = f"https://hack2skill.com/hackathons/{event_slug}" if event_slug else "https://hack2skill.com/hackathons"

            # Dates
            start_date = self._parse_iso_date(item.get("eventStart") or item.get("submissionStart"))
            end_date = self._parse_iso_date(item.get("eventEnd") or item.get("submissionEnd"))

            # Mode → location
            mode = str(item.get("mode", "")).upper()
            if mode == "ONLINE" or mode == "VIRTUAL":
                is_online = True
                location = "Online"
            elif mode == "IN_PERSON" or mode == "OFFLINE":
                is_online = False
                location = "In Person"
            elif mode == "HYBRID":
                is_online = True
                location = "Hybrid"
            else:
                is_online = True
                location = "Online"

            # Participation type
            participation = item.get("participation", "")

            # Ticket / fee
            ticket = item.get("ticket", "")
            prizes = item.get("rewards") or item.get("prize") or ""

            # Description
            description = item.get("shortDescription", "") or item.get("description", "")
            if description:
                description = re.sub(r'<[^>]+>', ' ', str(description))
                description = re.sub(r'\s+', ' ', description).strip()[:500]
            if not description:
                description = f"{title} - {participation} hackathon on Hack2Skill"

            # Status
            status = self._determine_status(start_date, end_date)

            return normalize_record({
                "name": title,
                "description": description,
                "url": url,
                "platform": HackathonPlatform.HACK2SKILL,
                "banner_url": item.get("bannerImage") or item.get("mobileBanner") or item.get("thumbnail"),
                "logo_url": item.get("iconImage"),
                "registration_deadline": item.get("registrationEnd"),
                "start_date": start_date,
                "end_date": end_date,
                "location": location,
                "is_online": is_online,
                "prizes": prizes,
                "themes": [n for t in (item.get("categories") or item.get("themes") or []) if (n := entity_name(t))],
                "organizer": entity_name(item.get("organizer")) or "Hack2Skill",
                "status": status,
            })

        except Exception as e:
            logger.error(f"Error parsing Hack2Skill API item: {e}")
            return None

    def _parse_iso_date(self, date_str):
        return parse_date(date_str)

    def _determine_status(self, start_date, end_date):
        return date_status(start_date, end_date)
