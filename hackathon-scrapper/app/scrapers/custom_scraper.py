from bs4 import BeautifulSoup
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.metadata import page_metadata
from app.utils.normalization import normalize_record

class CustomScraper(BaseScraper):
    """Extract OpenGraph, Twitter cards, JSON-LD Events, and site icons."""
    def can_handle(self, url):
        return True

    def scrape(self, url):
        soup = self.get_soup(url)
        if soup is not None and (
            not soup.select_one('h1, meta[property="og:title"], script[type="application/ld+json"]')
            or (soup.body is not None and len(soup.body.get_text(" ", strip=True)) < 80)
        ):
            html = self.get_rendered_content(url)
            if html:
                soup = BeautifulSoup(html, "lxml")
        if soup is None:
            return {"error": "Failed to fetch page"}
        return normalize_record({**page_metadata(soup, url), "platform": "custom"}, url)
