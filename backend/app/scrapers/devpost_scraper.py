from app.scrapers.listing_scraper import ListingScraper
from bs4 import BeautifulSoup
from app.scrapers.metadata import page_metadata, image_at, date_range, entity_name
from app.utils.normalization import normalize_record

class DevpostScraper(ListingScraper):
    platform = "devpost"
    domain = "devpost.com"
    listing_paths = ("/hackathons",)
    card_selector = '.hackathon-tile, a[data-role="featured_challenge"]'
    api_url = "https://devpost.com/api/hackathons"

    def _parse_api_item(self, item):
        if not item.get("title") or not item.get("url") or "submission_period_dates" not in item:
            return None
        start, end = date_range(item.get("submission_period_dates"))
        location = entity_name(item.get("displayed_location", {}).get("location"))
        return {
            "name": item["title"], "url": item["url"], "platform": self.platform,
            "banner_url": item.get("thumbnail_url"), "logo_url": item.get("organization_logo"),
            "prizes": BeautifulSoup(str(item.get("prize_amount", "")), "lxml").get_text(),
            "start_date": start, "end_date": end, "registration_deadline": end,
            "organizer": item.get("organization_name"), "registered_count": item.get("registrations_count"),
            "themes": [n for t in item.get("themes", []) if (n := entity_name(t))],
            "location": location, "is_online": location == "Online",
        }

    def scrape(self, url):
        if self.is_listing(url):
            return super().scrape(url)
        return self._scrape_detail_page(url)

    def _scrape_detail_page(self, url):
        soup = self.get_soup(url)
        if soup is None:
            return {"error": "Failed to fetch event page"}
        data = page_metadata(soup, url)
        data["banner_url"] = image_at(soup, ".featured-image img, #challenge-header[style]", url) or data.get("banner_url")
        data["logo_url"] = image_at(soup, ".organizer-logo img, img.organizer-logo", url) or data.get("logo_url")
        return normalize_record({**data, "platform": self.platform}, url)
