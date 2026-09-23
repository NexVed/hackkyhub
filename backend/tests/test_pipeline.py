import asyncio
import unittest
from unittest.mock import Mock, patch

from app.api import routes
from app.cache import redis_cache
from app.scrapers.mlh_scraper import MLHScraper
from app.scrapers.commudle_scraper import CommudleScraper
from bs4 import BeautifulSoup


class PipelineTests(unittest.TestCase):
    def test_cache_keys_include_page_and_generation(self):
        with patch.object(redis_cache, "get_cached", return_value=7), patch.object(redis_cache, "set_cached") as setter:
            redis_cache.cache_hackathon_list([], "devpost", "upcoming", 20, 10, False)
        self.assertEqual(setter.call_args.args[0], "scraper:hackathons:list:7:devpost:upcoming:20:10:False")

    def test_invalidation_advances_list_generation(self):
        client = Mock()
        with patch.object(redis_cache, "get_redis_client", return_value=client):
            redis_cache.invalidate_hackathon("event-id")
        client.incr.assert_called_once_with("scraper:hackathons:generation")
        client.delete.assert_called_once_with("scraper:hackathon:event-id")

    def test_empty_provider_is_reported_and_next_provider_continues(self):
        task_id = "test-provider-failure"
        routes.scraping_tasks[task_id] = {"status": "pending", "completed": 0, "results": []}
        try:
            with patch.object(routes, "PLATFORM_URLS", ["https://empty.test", "https://valid.test"]), patch.object(routes, "scrape_url_all", side_effect=[[], [{"name": "Build", "url": "https://build.test", "platform": "custom", "status": "ongoing"}]]), patch.object(routes.HackathonCRUD, "create_hackathon", return_value={"_id": "saved"}), patch.object(routes, "invalidate_hackathon"):
                asyncio.run(routes.process_scraping_all(task_id))
            result = routes.scraping_tasks[task_id]
            self.assertEqual(result["completed"], 2)
            self.assertEqual(result["errors"], 1)
            self.assertEqual(result["saved"], 1)
            self.assertFalse(result["results"][0]["success"])
        finally:
            del routes.scraping_tasks[task_id]

    def test_commudle_cursor_pagination(self):
        scraper = CommudleScraper()
        self.assertEqual(scraper.next_api_params({"data": {"page_info": {"has_next_page": True, "end_cursor": "next"}}}, 1), {"when": "future", "limit": 30, "after": "next"})
        self.assertIsNone(scraper.next_api_params({"data": {"page_info": {"has_next_page": False}}}, 1))

    def test_commudle_single_event_api(self):
        scraper = CommudleScraper()
        response = Mock()
        response.json.return_value = {"data": {"name": "Build", "slug": "build", "community": {"name": "Builders", "slug": "builders"}, "hackathon_location_type": "online", "application_end_date": "2026-10-01"}}
        with patch.object(scraper.session, "get", return_value=response) as fetch:
            result = scraper.scrape("https://www.commudle.com/communities/builders/hackathons/build")
        self.assertEqual(fetch.call_args.kwargs["params"], {"hackathon_id": "build"})
        self.assertEqual(result["name"], "Build")
        self.assertEqual(result["registration_deadline"], "2026-10-01T00:00:00+00:00")

    def test_mlh_current_hydration_prevents_duplicate_cards(self):
        soup = BeautifulSoup('''<script type="application/json">{"props":{"upcomingEvents":[{"name":"Build","startsAt":"2026-10-01T12:00:00Z","endsAt":"2026-10-02T12:00:00Z","websiteUrl":"https://build.test/","backgroundUrl":"https://cdn.test/banner.jpg","logoUrl":"https://cdn.test/logo.png","formatType":"digital"}]}}</script><div class="event-card"><a href="https://build.test/?utm_source=mlh"><h3>Build</h3></a></div>''', "lxml")
        records = MLHScraper()._parse_listing(soup, "https://mlh.io/seasons/2027/events")
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["url"], "https://build.test/")
        self.assertTrue(records[0]["is_online"])

    def test_listing_discovery_excludes_completed_events(self):
        from app import scrapers
        fake = Mock()
        fake._scrape_listing_page_all.return_value = [
            {"name": "Old", "url": "https://old.test", "platform": "custom", "status": "completed"},
            {"name": "Current", "url": "https://current.test", "platform": "custom", "status": "ongoing"},
        ]
        with patch.object(scrapers, "get_scraper", return_value=fake):
            records = scrapers.scrape_url_all("https://example.test/events")
        self.assertEqual([r["name"] for r in records], ["Current"])

    def test_mnc_api_hides_completed_rows_by_default(self):
        with patch.object(routes.HackathonCRUD, "get_mnc_hackathons", return_value=[
            {"name": "Old", "status": "completed", "is_mnc": True},
            {"name": "Current", "status": "ongoing", "is_mnc": True},
        ]):
            result = asyncio.run(routes.get_mnc_hackathons())
        self.assertEqual([row["name"] for row in result], ["Current"])


if __name__ == "__main__":
    unittest.main()
