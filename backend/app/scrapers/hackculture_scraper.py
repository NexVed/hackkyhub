from app.scrapers.listing_scraper import ListingScraper

class HackCultureScraper(ListingScraper):
    platform = "hackculture"
    domain = "hackculture.com"
    listing_paths = ("", "/events")
    card_selector = '.event-card, .hackathon-card, article, a[href*="/events/"]'

    def _parse_listing(self, soup, url):
        return [event for event in super()._parse_listing(soup, url)
                if "/events/" in event.get("url", "")]
