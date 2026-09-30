from urllib.parse import urlsplit, urljoin
from app.utils.normalization import belongs_to, parse_date, date_status, normalize_record
from app.scrapers.metadata import entity_name
from app.scrapers.custom_scraper import CustomScraper
from typing import Dict, Any, Optional, List
import re
from datetime import datetime
import logging
import requests

from app.scrapers.base_scraper import BaseScraper
from app.models.hackathon import HackathonPlatform

logger = logging.getLogger(__name__)

# Unstop public JSON API
UNSTOP_API_URL = "https://unstop.com/api/public/opportunity/search-result"


class UnstopScraper(BaseScraper):
    """Scraper for Unstop hackathons — uses their public JSON API for reliable data."""

    def can_handle(self, url: str) -> bool:
        """Check if the URL is from Unstop."""
        return belongs_to(url, "unstop.com")

    def scrape(self, url: str) -> Dict[str, Any]:
        """Scrape a single hackathon from Unstop. Returns the first result from listing."""
        if urlsplit(url).path.rstrip("/") not in ("/hackathons",):
            # Match the requested event exactly; SPA detail shells often only contain a brand title.
            target = urlsplit(url).path.rstrip("/")
            for event in self._scrape_listing_page_all("https://unstop.com/hackathons"):
                if urlsplit(event.get("url", "")).path.rstrip("/") == target:
                    return normalize_record(event, url)
            data = CustomScraper().scrape(url)
            if "error" not in data:
                data["platform"] = "unstop"
            return normalize_record(data, url)
        logger.info(f"Scraping Unstop URL: {url}")
        results = self._scrape_listing_page_all(url)
        if results:
            return results[0]
        return {"error": "No hackathons found from Unstop API"}

    def _scrape_listing_page_all(self, url: str) -> List[Dict[str, Any]]:
        if urlsplit(url).path.rstrip("/") not in ("/hackathons",):
            return [self.scrape(url)]
        """Fetch ALL hackathons from Unstop's JSON API (multiple pages)."""
        all_hackathons = []
        page = 1
        max_pages = 5  # Limit to 5 pages (90 hackathons max)

        while page <= max_pages:
            try:
                data = self._fetch_api_page(page)
                if not data:
                    break

                items = data.get("data", {}).get("data", [])
                if not items:
                    break

                for item in items:
                    parsed = self._parse_api_item(item)
                    if parsed:
                        all_hackathons.append(parsed)

                # Check if there are more pages
                current_page = data.get("data", {}).get("current_page", 0)
                last_page = data.get("data", {}).get("last_page", 0)
                if current_page >= last_page:
                    break

                page += 1

            except Exception as e:
                logger.error(f"Error fetching Unstop API page {page}: {e}")
                break

        logger.info(f"Unstop API: fetched {len(all_hackathons)} hackathons from {page} pages")
        return all_hackathons

    def _fetch_api_page(self, page: int = 1, per_page: int = 18) -> Optional[Dict]:
        """Fetch a single page from Unstop's hackathon API."""
        try:
            params = {
                "opportunity": "hackathons",
                "page": page,
                "per_page": per_page,
                "oppstatus": "open",
            }
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://unstop.com/hackathons",
            }
            resp = requests.get(UNSTOP_API_URL, params=params, headers=headers, timeout=15, allow_redirects=False)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Unstop API request failed: {e}")
            return None

    def _parse_api_item(self, item: Dict) -> Optional[Dict[str, Any]]:
        """Parse a single hackathon item from the Unstop API response."""
        if not item.get("title") or not item.get("seo_url"):
            return None
        try:
            # Name
            name = item.get("title", "Unknown Hackathon")

            # URL
            url = item.get("seo_url", "")
            if url and not url.startswith("http"):
                url = urljoin("https://unstop.com/", url)

            # Organization
            org = item.get("organisation", {})
            organizer = org.get("name", "Unstop") if isinstance(org, dict) else "Unstop"

            # Dates
            regn = item.get("regnRequirements", {}) or {}
            start_date = self._parse_iso_date(item.get("start_date"))
            end_regn = self._parse_iso_date(regn.get("end_regn_dt"))
            end_date = self._parse_iso_date(item.get("end_date"))

            # Description (strip HTML)
            description = item.get("details", "")
            if description:
                description = re.sub(r'<[^>]+>', ' ', description)
                description = re.sub(r'\s+', ' ', description).strip()[:500]

            # Location / Online
            is_online = False
            location = None
            opp_type = str(item.get("type", "")).lower()
            fest = item.get("festival", {}) or {}
            fest_type = str(fest.get("type", "")).lower() if isinstance(fest, dict) else ""

            if "online" in opp_type or "online" in fest_type or "virtual" in name.lower():
                is_online = True
                location = "Online"
            elif "offline" in opp_type or "offline" in fest_type:
                location = organizer  # Use org as location proxy
            else:
                is_online = True  # Default to online if unclear
                location = "Online"

            # Prizes
            prizes = ""
            prize_data = item.get("prizes", item.get("prize", ""))
            if isinstance(prize_data, (int, float)):
                prizes = f"₹{prize_data:,.0f}"
            elif isinstance(prize_data, str) and prize_data:
                prizes = prize_data

            # Themes / Tags
            themes = []
            filters = item.get("filters", []) or []
            for f in filters:
                if isinstance(f, dict):
                    fname = f.get("name", "")
                    if fname and len(fname) < 50:
                        themes.append(fname)

            # Status
            status = self._determine_status_from_api(item, start_date, end_date)

            # Engagement
            views = item.get("viewsCount", 0)
            registered = item.get("registerCount", 0)
            if not description and (views or registered):
                description = f"{registered} registered, {views} views"

            return normalize_record({
                "name": name,
                "description": description,
                "url": url,
                "platform": HackathonPlatform.UNSTOP,
                "banner_url": item.get("banner_desktop") or item.get("banner_mobile") or item.get("banner"),
                "logo_url": (org.get("logoUrl2") or org.get("logo")) if isinstance(org, dict) else None,
                "registration_deadline": end_regn,
                "prize_currency": "INR",
                "registered_count": registered,
                "view_count": views,
                "start_date": start_date,
                "end_date": end_date,
                "location": location,
                "is_online": is_online,
                "prizes": prizes,
                "themes": themes[:10],
                "organizer": organizer,
                "status": status,
            })

        except Exception as e:
            logger.error(f"Error parsing Unstop API item: {e}")
            return None

    def _parse_iso_date(self, date_str):
        return parse_date(date_str)

    def _determine_status_from_api(self, item: Dict, start_date, end_date) -> str:
        """Determine hackathon status from API data."""
        opp_status = str(item.get("oppstatus", "")).lower()
        if opp_status == "open":
            return "upcoming"
        elif opp_status == "closed":
            return "completed"
        elif opp_status == "live":
            return "ongoing"

        # Fallback to date-based
        return self._determine_status(start_date, end_date)

    def _determine_status(self, start_date, end_date):
        return date_status(start_date, end_date)
