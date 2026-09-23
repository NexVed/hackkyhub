import json
import re
from app.scrapers.listing_scraper import ListingScraper
from app.utils.normalization import http_url
from app.scrapers.metadata import parse_card, structured_events, event_metadata, objects

class MLHScraper(ListingScraper):
    platform = "mlh"
    domain = "mlh.io"
    card_selector = ".event-wrapper, .event-card"

    def is_listing(self, url):
        from urllib.parse import urlsplit
        return bool(re.fullmatch(r"/seasons/\d{4}/events/?", urlsplit(url).path))

    def _parse_listing(self, soup, url):
        results = [{**event_metadata(event, url), "platform": self.platform} for event in structured_events(soup)]
        for script in soup.select('script[type="application/json"]'):
            try:
                for item in objects(json.loads(script.get_text())):
                    if not item.get("name") or not item.get("startsAt"):
                        continue
                    results.append({
                        "name": item["name"], "platform": self.platform,
                        "url": http_url(item.get("websiteUrl") or item.get("url"), url),
                        "banner_url": item.get("backgroundUrl"), "logo_url": item.get("logoUrl"),
                        "start_date": item.get("startsAt"), "end_date": item.get("endsAt"),
                        "location": item.get("location"), "is_online": item.get("formatType") in ("digital", "hybrid"),
                        "organizer": "MLH",
                    })
            except (ValueError, TypeError):
                continue
        if results:
            return results  # Do not ingest the same events again from tracking-tagged cards.
        cards = soup.select(self.card_selector) or soup.select('.event, a[itemtype="https://schema.org/Event"]')
        for card in cards:
            # Season spans two calendar years. Prefer card microdata or explicit years.
            parsed = parse_card(card, url, self.platform)
            if parsed:
                parsed["organizer"] = parsed.get("organizer") or "MLH"
                results.append(parsed)
        return results
