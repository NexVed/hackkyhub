from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from datetime import datetime
import logging

from app.scrapers.base_scraper import BaseScraper
from app.models.hackathon import HackathonPlatform

logger = logging.getLogger(__name__)

class CustomScraper(BaseScraper):
    """Generic scraper for other hackathon websites"""
    
    def can_handle(self, url: str) -> bool:
        """This scraper handles any URL not handled by specialized scrapers"""
        return True
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """Generic scraping for any hackathon website"""
        logger.info(f"Scraping custom URL: {url}")
        
        # Try with requests first
        soup = self.get_soup(url)
        
        # If content is dynamic, use Selenium
        if soup and self._needs_javascript(soup):
            driver = self.get_driver()
            try:
                driver.get(url)
                soup = BeautifulSoup(driver.page_source, 'lxml')
            finally:
                driver.quit()
        
        if not soup:
            return {"error": "Failed to fetch page"}
        
        try:
            # Extract information using common patterns
            name = self._extract_name(soup)
            description = self._extract_description(soup)
            dates = self._extract_dates(soup)
            location, is_online = self._extract_location(soup)
            prizes = self._extract_prizes(soup)
            organizer = self._extract_organizer(soup)
            
            return {
                "name": name,
                "description": description,
                "url": url,
                "platform": HackathonPlatform.CUSTOM,
                "start_date": dates[0],
                "end_date": dates[1],
                "location": location,
                "is_online": is_online,
                "prizes": prizes,
                "themes": [],
                "organizer": organizer,
                "status": self._determine_status(dates[0], dates[1])
            }
            
        except Exception as e:
            logger.error(f"Error scraping custom URL {url}: {str(e)}")
            return {"error": str(e)}
    
    def _needs_javascript(self, soup: BeautifulSoup) -> bool:
        """Check if page needs JavaScript rendering"""
        # Check for common indicators
        return bool(soup.find('div', {'id': 'app'})) or \
               bool(soup.find('div', {'id': 'root'})) or \
               'react' in str(soup).lower()
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract hackathon name using common patterns"""
        patterns = [
            ('h1', {'class': 'title'}),
            ('h1', {'class': 'name'}),
            ('h1', {}),
            ('title', {}),
            ('meta', {'property': 'og:title'})
        ]
        
        for tag, attrs in patterns:
            elem = soup.find(tag, attrs)
            if elem:
                if tag == 'meta':
                    return elem.get('content', 'Unknown')
                return elem.text.strip()
        
        return "Unknown"
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract description using common patterns"""
        patterns = [
            ('div', {'class': 'description'}),
            ('div', {'class': 'about'}),
            ('meta', {'name': 'description'}),
            ('meta', {'property': 'og:description'})
        ]
        
        for tag, attrs in patterns:
            elem = soup.find(tag, attrs)
            if elem:
                if tag == 'meta':
                    return elem.get('content', '')
                return elem.text.strip()[:500]  # Limit description length
        
        return ""
    
    def _extract_dates(self, soup: BeautifulSoup) -> tuple:
        """Extract dates using common patterns"""
        date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',
            r'(\d{2}/\d{2}/\d{4})',
            r'(\w+\s+\d{1,2},?\s+\d{4})'
        ]
        
        text = soup.get_text()
        
        for pattern in date_patterns:
            dates = re.findall(pattern, text)
            if len(dates) >= 2:
                return self.parse_date(dates[0]), self.parse_date(dates[1])
            elif len(dates) == 1:
                return self.parse_date(dates[0]), None
        
        return None, None
    
    def _extract_location(self, soup: BeautifulSoup) -> tuple:
        """Extract location and online status"""
        location_keywords = ['location', 'venue', 'address', 'where']
        online_keywords = ['online', 'virtual', 'remote']
        
        location = None
        is_online = False
        
        # Check for location elements
        for keyword in location_keywords:
            elem = soup.find(text=re.compile(keyword, re.I))
            if elem:
                parent = elem.parent
                if parent:
                    location_text = parent.get_text()
                    location = location_text.replace(keyword, '').strip()
                    
                    # Check if it's online
                    for online_word in online_keywords:
                        if online_word in location_text.lower():
                            is_online = True
                            break
                    break
        
        return location, is_online
    
    def _extract_prizes(self, soup: BeautifulSoup) -> str:
        """Extract prize information"""
        prize_keywords = ['prize', 'prizes', 'awards', 'reward']
        
        for keyword in prize_keywords:
            elem = soup.find(text=re.compile(keyword, re.I))
            if elem:
                parent = elem.parent
                if parent:
                    prize_text = parent.get_text()
                    if len(prize_text) < 500:  # Limit length
                        return prize_text
        return ""
    
    def _extract_organizer(self, soup: BeautifulSoup) -> str:
        """Extract organizer information"""
        organizer_keywords = ['organizer', 'hosted by', 'presented by', 'by']
        
        for keyword in organizer_keywords:
            elem = soup.find(text=re.compile(keyword, re.I))
            if elem:
                parent = elem.parent
                if parent:
                    return parent.get_text().replace(keyword, '').strip()
        return ""