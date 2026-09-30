import unittest
from unittest.mock import patch, Mock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.routes import router
from app.security import allowed_scrape_url, require_public_destination, ScraperSession

class SecurityTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router, prefix="/api/v1")
        self.client = TestClient(app)

    def test_write_endpoints_reject_anonymous_and_wrong_token_before_database_access(self):
        with patch.dict("os.environ", {"SCRAPER_API_TOKEN": "test-service-token"}):
            for method, path, body in [("post", "/scrape", {"urls":["https://devpost.com/hackathons"]}), ("post", "/scrape-all", None), ("put", "/hackathons/fake", {"name":"takeover"}), ("delete", "/hackathons/fake", None)]:
                kwargs = {"json":body} if body is not None else {}
                self.assertEqual(getattr(self.client,method)("/api/v1"+path, **kwargs).status_code,401)
                self.assertEqual(getattr(self.client,method)("/api/v1"+path,headers={"Authorization":"Bearer wrong"},**kwargs).status_code,401)

    def test_valid_token_reaches_handler_and_missing_configuration_fails_closed(self):
        with patch.dict("os.environ", {"SCRAPER_API_TOKEN":"test-token"}):
            self.assertEqual(self.client.get("/api/v1/scrape/status/missing",headers={"Authorization":"Bearer test-token"}).status_code,404)
        with patch.dict("os.environ", {}, clear=True):
            self.assertEqual(self.client.delete("/api/v1/hackathons/fake").status_code,503)

    def test_scrape_rejects_private_spoofed_and_oversized_requests(self):
        bad=["http://127.0.0.1/admin","https://169.254.169.254/latest/meta-data","https://[::1]/", "file:///etc/passwd", "https://devpost.com.evil.test/", "https://devpost.com@evil.test/", "https://devpost.com:8080/", "https://devpost.com\\@evil.test/"]
        with patch.dict("os.environ", {"SCRAPER_API_TOKEN":"test-token","SCRAPER_ALLOWED_HOSTS":""}):
            for url in bad:
                self.assertFalse(allowed_scrape_url(url),url)
                self.assertEqual(self.client.post("/api/v1/scrape",headers={"Authorization":"Bearer test-token"},json={"urls":[url]}).status_code,400)
            self.assertEqual(self.client.post("/api/v1/scrape",headers={"Authorization":"Bearer test-token"},json={"urls":["https://devpost.com/"]*21}).status_code,422)
        self.assertTrue(allowed_scrape_url("https://vision.hack2skill.com/hackathons-listing"))

    def test_private_dns_and_redirects_are_blocked_before_send(self):
        with patch("app.security.socket.getaddrinfo",return_value=[(2,1,6,"",("127.0.0.1",443))]):
            with self.assertRaises(ValueError): require_public_destination("https://devpost.com/")
        request=Mock(url="https://169.254.169.254/latest/meta-data")
        with patch("requests.Session.send") as send:
            with self.assertRaises(ValueError): ScraperSession().send(request)
            send.assert_not_called()
