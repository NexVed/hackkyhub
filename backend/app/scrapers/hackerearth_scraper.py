from app.scrapers.listing_scraper import ListingScraper
from app.scrapers.metadata import entity_name
from app.utils.normalization import http_url

class HackerEarthScraper(ListingScraper):
    platform = "hackerearth"
    domain = "hackerearth.com"
    listing_paths = ("/challenges/hackathon",)
    api_url = "https://www.hackerearth.com/chrome-extension/events/"
    max_pages = 1
    card_selector = ".challenge-card-modern, .challenge-card, .upcoming-challenge-list .challenge-list-item"

    def _parse_listing(self, soup, url):
        results = super()._parse_listing(soup, url)
        for result in results:
            if not result.get("location"):
                result.update(location="Online", is_online=True)
        return results

    def _parse_api_item(self, item):
        url = http_url(item.get("url") or item.get("challenge_url"), "https://www.hackerearth.com")
        name = item.get("title") or item.get("name")
        if not name or not url or "/challenges/hackathon/" not in url:
            return None
        return {
            "name": name, "url": url, "platform": self.platform,
            "description": item.get("description"),
            "banner_url": item.get("image") or item.get("banner") or item.get("thumbnail"),
            "logo_url": item.get("company_logo") or item.get("logo"),
            "organizer": entity_name(item.get("company") or item.get("organizer")),
            "sponsors": entity_name(item.get("sponsors")),
            "prizes": item.get("prizes") or item.get("prize"),
            "start_date": item.get("start_tz") or item.get("start_timestamp") or item.get("start_date"),
            "end_date": item.get("end_tz") or item.get("end_timestamp") or item.get("end_date"),
            "registration_deadline": item.get("registration_deadline"),
            "location": item.get("location") or "Online", "is_online": not bool(item.get("location")),
        }
