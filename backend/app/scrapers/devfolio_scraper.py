from app.scrapers.listing_scraper import ListingScraper
from app.scrapers.metadata import entity_name
from app.utils.normalization import http_url

class DevfolioScraper(ListingScraper):
    platform = "devfolio"
    domain = "devfolio.co"
    listing_paths = ("/hackathons",)
    api_url = "https://api.devfolio.co/api/hackathons"
    card_selector = '.hackathon-card, a[href*=".devfolio.co"]'

    def api_params(self, page):
        return {"filter": "all", "page": page, "limit": 30}

    def _parse_api_item(self, item):
        slug = item.get("slug")
        if not item.get("name") or not isinstance(slug, str):
            return None
        # Hydration contains users and tags too; require an event-specific field.
        if not any(k in item for k in ("starts_at", "ends_at", "hero_image", "is_online", "hackathon_setting")):
            return None
        settings = item.get("hackathon_setting") or item.get("settings") or {}
        online = item.get("is_online") is True
        return {
            "name": item["name"], "slug": slug, "platform": self.platform,
            "url": http_url(item.get("url")) or f"https://{slug}.devfolio.co",
            "description": item.get("description") or item.get("tagline"),
            "banner_url": item.get("hero_image") or item.get("cover_img") or item.get("banner"),
            "logo_url": item.get("avatar") or item.get("logo") or settings.get("logo"),
            "prizes": item.get("prizes") or item.get("total_prize_amount"),
            "prize_currency": item.get("prize_currency"),
            "start_date": item.get("starts_at"), "end_date": item.get("ends_at"),
            "registration_deadline": item.get("reg_ends_at") or settings.get("reg_ends_at"),
            "is_online": online, "location": "Online" if online else entity_name(item.get("location")),
            "themes": [n for t in (item.get("tags") or item.get("themes") or []) or [] if (n := entity_name(t.get("theme", t) if isinstance(t, dict) else t))],
            "registered_count": item.get("participants_count"),
            "organizer": entity_name(item.get("organizer")), "sponsors": entity_name(item.get("sponsors")),
        }
