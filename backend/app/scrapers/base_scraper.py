from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from app.security import ScraperSession, require_public_destination
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """Base class for all scrapers"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.session = ScraperSession()
        self.session.trust_env = False
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Get BeautifulSoup object from URL"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml')
            soup._source_url = response.url
            return soup
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    def get_rendered_content(self, url: str) -> Optional[str]:
        """Get rendered HTML of a JavaScript-dependent page using Playwright"""
        try:
            require_public_destination(url)
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                context = browser.new_context(service_workers="block")
                page = context.new_page()
                def guard(route):
                    try:
                        require_public_destination(route.request.url)
                        route.continue_()
                    except (ValueError, OSError):
                        route.abort()
                context.route("**/*", guard)
                page.goto(url, wait_until='networkidle', timeout=30000)
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error(f"Error rendering {url}: {str(e)}")
            return None
    
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Check if this scraper can handle the given URL"""
        pass
    
    @abstractmethod
    def scrape(self, url: str) -> Dict[str, Any]:
        """Scrape hackathon information from URL"""
        pass
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        # Override in child classes for specific date formats
        try:
            # Common date formats
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y"]:
                try:
                    return datetime.strptime(date_str.strip(), fmt)
                except ValueError:
                    continue
        except Exception:
            return None
        return None
