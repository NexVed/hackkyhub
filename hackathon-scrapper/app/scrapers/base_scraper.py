from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """Base class for all scrapers"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Get BeautifulSoup object from URL"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'lxml')
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    def get_driver(self):
        """Get Selenium WebDriver for JavaScript-rendered pages"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=chrome_options)
    
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