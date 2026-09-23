"""Bounded public API discovery with structured-data and HTML fallbacks."""
import json
import logging
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.metadata import objects, structured_events, event_metadata, page_metadata, parse_card
from app.utils.normalization import belongs_to, normalize_record

logger = logging.getLogger(__name__)

class ListingScraper(BaseScraper):
    platform = "custom"
    domain = ""
    listing_paths = ()
    api_url = None
    card_selector = ".event-card"
    max_pages = 10

    def can_handle(self, url):
        return belongs_to(url, self.domain)

    def is_listing(self, url):
        return urlsplit(url).path.rstrip("/") in self.listing_paths

    def scrape(self, url):
        if self.is_listing(url):
            results = self._scrape_listing_page_all(url)
            return results[0] if results else {"error": f"No events found for {self.platform}"}
        soup = self.get_soup(url)
        if soup is None:
            return {"error": "Failed to fetch event page"}
        return normalize_record({**page_metadata(soup, url), "platform": self.platform}, url)

    def api_params(self, page):
        return {"page": page, "limit": 30}

    def next_api_params(self, payload, page):
        return self.api_params(page + 1)

    def _parse_api_item(self, item):
        return None

    def _api_results(self, url):
        results, seen = [], set()
        if not self.api_url:
            return results
        params = self.api_params(1)
        for page in range(1, self.max_pages + 1):
            try:
                response = self.session.get(self.api_url, params=params, headers={"Accept": "application/json", "Referer": url}, timeout=15)
                response.raise_for_status()
                payload = response.json()
                added = 0
                for item in objects(payload):
                    try:
                        parsed = self._parse_api_item(item)
                    except (ValueError, TypeError, AttributeError, KeyError) as exc:
                        logger.debug("Skipping malformed %s event: %s", self.platform, exc)
                        continue
                    if parsed and parsed.get("url") not in seen:
                        seen.add(parsed["url"])
                        results.append(parsed)
                        added += 1
                if not added:
                    break
                params = self.next_api_params(payload, page)
                if params is None:
                    break
            except Exception as exc:
                logger.warning("%s API page %s unavailable: %s", self.platform, page, exc)
                break
        return results

    def _parse_listing(self, soup, url):
        results = [{**event_metadata(event, url), "platform": self.platform} for event in structured_events(soup)]
        for script in soup.select('script#__NEXT_DATA__, script#__INITIAL_STATE__'):
            try:
                for item in objects(json.loads(script.string or script.get_text())):
                    parsed = self._parse_api_item(item)
                    if parsed:
                        results.append(parsed)
            except (ValueError, TypeError):
                continue
        for card in soup.select(self.card_selector):
            parsed = parse_card(card, url, self.platform)
            if parsed:
                results.append(parsed)
        return results

    def _scrape_listing_page_all(self, url):
        if not self.is_listing(url):
            return [self.scrape(url)]
        results = self._api_results(url)
        if not results:
            soup = self.get_soup(url)
            if soup is not None:
                results = self._parse_listing(soup, url)
            if not results:
                html = self.get_rendered_content(url)
                if html:
                    results = self._parse_listing(BeautifulSoup(html, "lxml"), url)
        unique = {}
        for result in results:
            normalized = normalize_record(result, url)
            if "error" not in normalized and normalized["url"].rstrip("/") != url.rstrip("/"):
                unique.setdefault(normalized["url"], normalized)
        return list(unique.values())
