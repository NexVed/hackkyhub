import json
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit
from bs4 import BeautifulSoup

from app.scrapers import PLATFORM_URLS, get_scraper, scrape_url_all
from app.scrapers.custom_scraper import CustomScraper
from app.scrapers.metadata import date_range
from app.utils.normalization import normalize_record, prize_value, is_mnc, parse_date, redirect_url
from app.models.hackathon import HackathonCreate, HackathonUpdate
from app.database.crud import HackathonCRUD


class NormalizationTests(unittest.TestCase):
    def test_monetary_prizes(self):
        for text, expected in [
            ("₹10,00,000", (1000000, "INR")), ("$75,000 in prizes", (75000, "USD")),
            ("INR 2.5 lakh", (250000, "INR")), ("₹1 crore", (10000000, "INR")),
            ("€10K", (10000, "EUR")), ("500 GBP", (500, "GBP")),
            ("Entry: $100", (None, None)), ("Interviews and swag", (None, None)),
            ("$100 + ₹2000", (None, None)),
        ]:
            with self.subTest(text=text):
                self.assertEqual(prize_value(text), expected)

    def test_company_boundaries(self):
        self.assertTrue(is_mnc("Flipkart GRiD"))
        self.assertTrue(is_mnc("Imagine Cup"))
        self.assertTrue(is_mnc("", "Walmart Global Tech"))
        self.assertFalse(is_mnc("Journey to the Metaverse", "Honeywell Community"))
        self.assertFalse(is_mnc("Keynote", "University"))

    def test_dates_and_range(self):
        self.assertEqual(parse_date("2026-09-15T12:00:00+05:30").isoformat(), "2026-09-15T06:30:00+00:00")
        self.assertEqual(parse_date("05-10-2026").month, 10)
        start, end = date_range("Oct 18th - 20th, 2026")
        self.assertEqual((start.day, end.day, end.year), (18, 20, 2026))
        start, end = date_range("Dec 31 - Jan 2, 2027")
        self.assertEqual((start.year, end.year), (2026, 2027))
        self.assertEqual(date_range("Oct 18 - 20"), (None, None))

    def test_redirect_preserves_query_and_fragment(self):
        url = "https://example.org/apply?track=ai&track=web&ref=partner#form"
        result = redirect_url(url, "mlh")
        self.assertEqual(parse_qs(urlsplit(result).query), {"track": ["ai", "web"], "ref": ["partner"], "utm_source": ["hackkyhub"]})
        self.assertEqual(urlsplit(result).fragment, "form")
        self.assertEqual(redirect_url(result, "mlh"), result)

    def test_record_contract(self):
        result = normalize_record({"name": "Test", "url": "https://event.org", "platform": "devpost", "prizes": "$5,000", "start_date": "2020-01-01", "end_date": "2020-01-02"})
        validated = HackathonCreate.model_validate(result)
        self.assertEqual(validated.prize_amount, 5000)
        self.assertEqual(validated.status, "completed")
        self.assertIn("ref_medium=hackkyhub", validated.redirect_url)
        self.assertNotIn("banner_url", result)
        self.assertIn("error", normalize_record({"name": "Test", "url": "javascript:alert(1)"}))


class ProviderTests(unittest.TestCase):
    def test_registry_and_hostname_spoofing(self):
        self.assertEqual(len(PLATFORM_URLS), 9)
        for url in PLATFORM_URLS:
            self.assertNotIsInstance(get_scraper(url), CustomScraper)
            scraper = get_scraper(url)
            self.assertFalse(scraper.can_handle("https://evil.test/?url=" + url))
        self.assertIsInstance(get_scraper("https://devfolio.co.evil.test"), CustomScraper)

    def test_api_provider_fields(self):
        cases = [
            ("https://devfolio.co/hackathons", {"name": "Google Build", "slug": "build", "starts_at": "2026-10-01", "cover_img": "https://cdn.test/banner.png", "hackathon_setting": {"logo": "https://cdn.test/logo.png", "reg_ends_at": "2026-09-30"}, "prizes": "$5000"}),
            ("https://www.hackerearth.com/challenges/hackathon/", {"title": "Build", "url": "https://www.hackerearth.com/challenges/hackathon/build/", "thumbnail": "https://cdn.test/banner.png", "company_logo": "https://cdn.test/logo.png", "company": {"name": "Microsoft"}, "prizes": "$5000"}),
            ("https://unstop.com/hackathons", {"title": "Build", "seo_url": "/hackathons/build-123", "banner_desktop": {"image_url": "https://cdn.test/banner.png"}, "organisation": {"name": "Tata", "logoUrl2": "https://cdn.test/logo.png"}, "prizes": 5000, "registerCount": "25", "viewsCount": 42}),
            ("https://vision.hack2skill.com/hackathons-listing", {"title": "Amazon Build", "eventUrl": "build", "bannerImage": "https://cdn.test/banner.png", "iconImage": "https://cdn.test/logo.png", "prize": "$5000", "registrationEnd": "2026-10-01", "eventStart": "2026-10-05", "eventEnd": "2026-10-06"}),
            ("https://devnovate.co/events", {"name": "IBM Build", "hackathon": "build", "bannerImage": "https://cdn.test/banner.png", "organizationLogo": "https://cdn.test/logo.png", "prizePool": "$5000", "startDate": "05-10-2026"}),
            ("https://www.commudle.com/explore/hackathons", {"name": "Build", "slug": "build", "community": {"slug": "builders", "name": "Google", "logo_image_path": {"url": "https://cdn.test/logo.png"}}, "banner_image": {"url": "https://cdn.test/banner.png"}, "hackathon_location_type": "online", "total_prize_amount": {"USD": 5000}}),
            ("https://devpost.com/hackathons", {"title": "Adobe Build", "url": "https://build.devpost.com", "submission_period_dates": "Oct 05 - 06, 2026", "thumbnail_url": "//cdn.test/banner.png", "organization_logo": "https://cdn.test/logo.png", "prize_amount": "$<span>5,000</span>"}),
        ]
        for url, item in cases:
            with self.subTest(url=url):
                result = normalize_record(get_scraper(url)._parse_api_item(item), url)
                valid = HackathonCreate.model_validate(result)
                self.assertEqual(valid.banner_url, "https://cdn.test/banner.png")
                self.assertEqual(valid.logo_url, "https://cdn.test/logo.png")
                self.assertEqual(valid.prize_amount, 5000)
                self.assertTrue(valid.is_mnc)
                self.assertTrue(valid.redirect_url.startswith("https://"))

    def test_no_entry_fee_as_prize_or_registration_as_event_dates(self):
        scraper = get_scraper("https://vision.hack2skill.com/hackathons-listing")
        result = scraper._parse_api_item({"title": "Build", "eventUrl": "build", "ticket": "₹500", "registrationStart": "2026-01-01", "registrationEnd": "2026-02-01"})
        self.assertNotIn("prize_amount", result)
        self.assertNotIn("start_date", result)
        self.assertEqual(result["registration_deadline"], "2026-02-01T00:00:00+00:00")

    def test_mlh_legacy_card_dates_assets_and_external_link(self):
        scraper = get_scraper("https://mlh.io/seasons/2027/events")
        soup = BeautifulSoup('''<div class="event-wrapper"><a class="event-link" href="https://hack.test/apply?track=1"><h3 class="event-name">Build</h3></a><div class="image-wrap"><img src="/banner.png"></div><div class="event-logo"><img src="/logo.png"></div><p class="event-date">Oct 18th - 20th, 2026</p><p class="event-location">Waterloo, ON</p></div>''', "lxml")
        result = normalize_record(scraper._parse_listing(soup, "https://mlh.io/seasons/2027/events")[0])
        self.assertEqual(result["end_date"], "2026-10-20T00:00:00+00:00")
        self.assertEqual(result["banner_url"], "https://mlh.io/banner.png")
        self.assertIn("track=1", result["redirect_url"])
        self.assertFalse(result["is_online"])

    def test_hackculture_dom_and_render_fallback(self):
        url = "https://hackculture.com/events"
        scraper = get_scraper(url)
        html = '<article><a href="/events/build"><h2>Build</h2></a><img src="/poster.jpg"><span class="prize">₹1 lakh</span></article>'
        with patch.object(scraper, "get_soup", return_value=BeautifulSoup("<div id='app'></div>", "lxml")), patch.object(scraper, "get_rendered_content", return_value=html):
            result = scraper._scrape_listing_page_all(url)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["prize_amount"], 100000)
        self.assertEqual(result[0]["banner_url"], "https://hackculture.com/poster.jpg")

    def test_pagination_deduplicates_repeated_api_pages(self):
        scraper = get_scraper("https://devfolio.co/hackathons")
        response = Mock()
        response.json.return_value = {"result": [{"name": "Build", "slug": "build", "starts_at": "2026-10-01"}]}
        with patch.object(scraper.session, "get", return_value=response) as fetch:
            results = scraper._api_results("https://devfolio.co/hackathons")
        self.assertEqual(len(results), 1)
        self.assertEqual(fetch.call_count, 2)

    def test_detail_url_matches_requested_event_instead_of_first_listing(self):
        url = "https://devnovate.co/hackathon/specific"
        scraper = get_scraper(url)
        with patch.object(scraper, "_fetch_api", return_value=[{"name": "Unrelated", "hackathon": "unrelated"}, {"name": "Specific", "hackathon": "specific"}]):
            results = scrape_url_all(url)
        self.assertEqual(results[0]["name"], "Specific")
        self.assertEqual(results[0]["platform"], "devnovate")

    def test_custom_json_ld_graph_and_metadata(self):
        html = '''<meta property="og:title" content="Fallback"><meta name="twitter:image" content="/banner.png"><link rel="canonical" href="/canonical"><link rel="icon" href="/icon.png"><script type="application/ld+json">{broken}</script><script type="application/ld+json">{"@graph":[{"@type":"Organization","name":"Ignore"},{"@type":["Event"],"name":"Build","startDate":"2026-10-01T10:00:00+05:30","location":{"@type":"VirtualLocation"},"organizer":{"name":"Google"},"offers":{"price":200,"priceCurrency":"USD"}}]}</script>'''
        scraper = CustomScraper()
        with patch.object(scraper, "get_soup", return_value=BeautifulSoup(html, "lxml")):
            result = scraper.scrape("https://event.test/apply")
        self.assertEqual(result["name"], "Build")
        self.assertTrue(result["is_online"])
        self.assertTrue(result["is_mnc"])
        self.assertEqual(result["banner_url"], "https://event.test/banner.png")
        self.assertEqual(result["url"], "https://event.test/canonical")
        self.assertNotIn("prize_amount", result)


class PersistenceTests(unittest.TestCase):
    def test_create_preserves_numeric_and_boolean_fields(self):
        client = Mock()
        with patch.object(HackathonCRUD, "_get_client", return_value=client):
            HackathonCRUD.create_hackathon({"name": "Google Build", "url": "https://build.test", "platform": "devpost", "prizes": "$5,000", "registered_count": 20, "banner_url": "https://cdn.test/banner.png"}, "https://devpost.com/hackathons")
        name, data = client.mutation.call_args.args
        self.assertEqual(name, "hackathons:create")
        self.assertEqual(data["prize_amount"], 5000)
        self.assertIs(data["is_mnc"], True)
        self.assertEqual(data["registered_count"], 20)
        self.assertEqual(data["banner_url"], "https://cdn.test/banner.png")
        self.assertNotIn("logo_url", data)

    def test_partial_update_retains_false_and_zero(self):
        client = Mock()
        with patch.object(HackathonCRUD, "_get_client", return_value=client):
            HackathonCRUD.update_hackathon("id", HackathonUpdate(is_mnc=False, registered_count=0))
        self.assertEqual(client.mutation.call_args.args[1], {"id": "id", "is_mnc": False, "registered_count": 0})


if __name__ == "__main__":
    unittest.main()
