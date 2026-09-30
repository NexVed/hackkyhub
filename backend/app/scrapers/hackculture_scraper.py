from app.scrapers.listing_scraper import ListingScraper
from app.scrapers.metadata import entity_name
from app.utils.normalization import belongs_to, http_url

class HackCultureScraper(ListingScraper):
    platform = "hackculture"
    domain = "hackculture.io"
    listing_paths = ("", "/programs", "/events")
    api_url = "https://api.hackculture.io/api/v1/hackathons"
    max_pages = 1  # The public directory's latest 50-card response.
    card_selector = '.event-card, .hackathon-card, article, a[href*="/events/"], a[href*="/hackathons/"]'

    def can_handle(self, url):
        return belongs_to(url, self.domain) or belongs_to(url, "hackculture.com")

    def api_params(self, page):
        return {"limit": 50, "response_type": "card", "sort_by": "start_datetime", "sort_order": -1}

    def _parse_api_item(self, item):
        slug = item.get("slug")
        if not item.get("name") or not isinstance(slug, str) or item.get("type") != "hackathon":
            return None
        branding = item.get("branding") if isinstance(item.get("branding"), dict) else {}
        return {
            "name": item["name"], "slug": slug, "platform": self.platform,
            "url": f"https://hackculture.io/hackathons/{slug}",
            "description": item.get("tagline"),
            "banner_url": http_url(branding.get("cover_photo")),
            "logo_url": http_url(branding.get("logo")),
            "start_date": item.get("start_datetime"), "end_date": item.get("end_datetime"),
            "registration_deadline": item.get("registration_end_datetime"),
            "is_online": item.get("mode") == "online", "location": entity_name(item.get("location")),
            "organizer": item.get("organizer_name"),
            "registered_count": item.get("total_participants"), "view_count": item.get("total_views"),
            "themes": [label for tag in (item.get("tags") or []) if (label := entity_name(tag))],
        }

    def _parse_listing(self, soup, url):
        return [event for event in super()._parse_listing(soup, url)
                if any(path in event.get("url", "") for path in ("/events/", "/hackathons/", "/hackathon/"))]
