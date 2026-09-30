"""Service authorization and narrowly scoped scraper destinations."""
import hmac
import os
import socket
import ipaddress
import requests
from urllib.parse import urlsplit
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)
PLATFORM_HOSTS = frozenset({"devpost.com", "mlh.io", "unstop.com", "hack2skill.com", "devnovate.co", "devfolio.co", "hackerearth.com", "commudle.com", "hackculture.io"})

def require_service_token(credentials: HTTPAuthorizationCredentials | None = Security(bearer)):
    expected = os.getenv("SCRAPER_API_TOKEN") or os.getenv("SCRAPER_SYNC_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="Scraper administration is not configured")
    if not credentials or not hmac.compare_digest(credentials.credentials.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

def allowed_scrape_url(url: str) -> bool:
    """Only HTTPS platform hosts (or explicitly trusted custom hosts), no userinfo."""
    try:
        parsed = urlsplit(url)
        host = (parsed.hostname or "").lower().rstrip(".")
        trusted = PLATFORM_HOSTS | {h.strip().lower() for h in os.getenv("SCRAPER_ALLOWED_HOSTS", "").split(",") if h.strip()}
        return (parsed.scheme == "https" and parsed.port in (None, 443) and parsed.username is None and parsed.password is None
                and not any(ord(c) < 33 or c == "\\" for c in url)
                and any(host == domain or host.endswith("." + domain) for domain in trusted))
    except ValueError:
        return False

def require_public_destination(url: str):
    if not allowed_scrape_url(url):
        raise ValueError("Scrape destination is not trusted")
    host = urlsplit(url).hostname
    addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(addr[4][0]).is_global or ipaddress.ip_address(addr[4][0]).is_multicast for addr in addresses):
        raise ValueError("Private and reserved scrape destinations are blocked")

class ScraperSession(requests.Session):
    def send(self, request, **kwargs):
        # requests sends redirects through send too, so every hop is checked.
        require_public_destination(request.url)
        return super().send(request, **kwargs)
