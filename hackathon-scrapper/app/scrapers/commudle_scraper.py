from app.scrapers.listing_scraper import ListingScraper
from app.scrapers.metadata import entity_name
from app.utils.normalization import http_url, normalize_record
from urllib.parse import urlsplit
import logging

class CommudleScraper(ListingScraper):
    platform = "commudle"
    domain = "commudle.com"
    listing_paths = ("/explore/hackathons", "/explore/events")
    api_url = "https://json.commudle.com/api/v2/hackathons/public/all_hackathons"
    card_selector = '.event-card, .hackathon-card, a[href*="/events/"]'

    def scrape(self, url):
        if not self.is_listing(url) and "/hackathons/" in urlsplit(url).path:
            slug = urlsplit(url).path.rstrip("/").split("/hackathons/", 1)[1].split("/")[0]
            try:
                response = self.session.get(
                    "https://json.commudle.com/api/v2/hackathons/public/show",
                    params={"hackathon_id": slug}, timeout=15,
                )
                response.raise_for_status()
                item = response.json().get("data", {})
                parsed = self._parse_api_item(item)
                if parsed:
                    return normalize_record(parsed, url)
            except Exception as exc:
                logging.getLogger(__name__).warning("Commudle event unavailable: %s", exc)
        return super().scrape(url)

    def api_params(self, page):
        return {"when": "future", "limit": 30}

    def next_api_params(self, payload, page):
        info = payload.get("data", payload).get("page_info", {})
        if not info.get("has_next_page") or not info.get("end_cursor"):
            return None
        return {**self.api_params(page), "after": info["end_cursor"]}

    def _parse_api_item(self, item):
        community = item.get("community") or item.get("kommunity") or {}
        slug = item.get("slug")
        name = item.get("name") or item.get("title")
        if not name or not slug or not isinstance(community, dict) or not community.get("slug"):
            return None
        event_type = str(item.get("event_type") or item.get("type") or "hackathon").lower()
        if "hackathon" not in event_type:
            return None
        route = "hackathons" if "hackathon_location_type" in item else "events"
        totals = item.get("total_prize_amount") or {}
        prizes = item.get("prizes") or item.get("prize_pool")
        if not prizes and isinstance(totals, dict):
            prizes = " + ".join(f"{currency} {amount}" for currency, amount in totals.items())
        return {
            "name": name, "slug": slug, "platform": self.platform,
            "url": http_url(item.get("url")) or f"https://www.commudle.com/communities/{community['slug']}/{route}/{slug}",
            "description": item.get("description"),
            "banner_url": item.get("banner") or item.get("banner_image") or item.get("header_image") or item.get("image"),
            "logo_url": community.get("logo") or community.get("logo_image_path") or community.get("image"),
            "organizer": entity_name(community), "prizes": prizes,
            "start_date": item.get("start_time") or item.get("start_date"),
            "end_date": item.get("end_time") or item.get("end_date"),
            "registration_deadline": item.get("registration_deadline") or item.get("application_end_date"),
            "location": entity_name(item.get("location")) or item.get("location_name") or item.get("hackathon_location_type"),
            "is_online": item.get("is_online") is True or item.get("hackathon_location_type") in ("online", "hybrid"),
        }
