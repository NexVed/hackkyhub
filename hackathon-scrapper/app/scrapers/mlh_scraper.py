from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import logging

from app.scrapers.base_scraper import BaseScraper
from app.models.hackathon import HackathonPlatform

logger = logging.getLogger(__name__)

class MLHScraper(BaseScraper):
    """Scraper for MLH hackathons"""
    
    def can_handle(self, url: str) -> bool:
        """Check if URL is from MLH"""
        return "mlh.io" in url.lower()
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """Scrape hackathon information from MLH"""
        logger.info(f"Scraping MLH URL: {url}")
        
        # If it's a listing/events page, return the first result
        if "/events" in url or "/seasons" in url:
            results = self._scrape_listing_page_all(url)
            if results:
                return results[0]
            return {"error": "No hackathons found on MLH events page"}
        
        # Otherwise scrape a single hackathon detail page
        soup = self.get_soup(url)
        if not soup:
            return {"error": "Failed to fetch page"}
        
        try:
            json_ld = self._extract_json_ld(soup)
            if json_ld:
                return self._parse_json_ld(json_ld, url)
            return self._parse_html(soup, url)
        except Exception as e:
            logger.error(f"Error scraping MLH URL {url}: {str(e)}")
            return {"error": str(e)}

    def _scrape_listing_page_all(self, url: str) -> list:
        """Scrape ALL hackathon cards from the MLH events/seasons page."""
        soup = self.get_soup(url)
        if not soup:
            return []
        
        results = []
        try:
            # MLH event cards have various structures
            event_cards = soup.find_all('div', class_=re.compile(r'event-wrapper|event-card|event')) or \
                          soup.find_all('a', class_=re.compile(r'event'))
            
            if not event_cards:
                # Try finding links to individual hackathon pages
                event_cards = soup.find_all('a', href=re.compile(r'mlh\.io/.*event'))
            
            for card in event_cards[:20]:
                try:
                    # Extract name
                    name_elem = card.find(['h3', 'h4', 'h2', 'p'], class_=re.compile(r'title|name|heading|event-name'))
                    if not name_elem:
                        name_elem = card.find(['h3', 'h4', 'h2'])
                    name = name_elem.get_text(strip=True) if name_elem else card.get_text(strip=True)[:80]
                    
                    if not name or len(name) < 3:
                        continue
                    
                    # Extract URL
                    href = card.get('href', '')
                    if not href:
                        link = card.find('a', href=True)
                        href = link['href'] if link else ''
                    if href and not href.startswith('http'):
                        href = f"https://mlh.io{href}"
                    hackathon_url = href or url
                    
                    # Location
                    loc_elem = card.find(['span', 'p', 'div'], class_=re.compile(r'location|city'))
                    location = loc_elem.get_text(strip=True) if loc_elem else None
                    is_online = 'digital' in (location or '').lower() or 'hybrid' in (location or '').lower()
                    
                    # Date
                    date_elem = card.find(['span', 'p'], class_=re.compile(r'date|time'))
                    date_text = date_elem.get_text(strip=True) if date_elem else ""
                    
                    results.append({
                        "name": name,
                        "description": f"MLH Hackathon: {name}",
                        "url": hackathon_url,
                        "platform": HackathonPlatform.MLH,
                        "start_date": self.parse_date(date_text) if date_text else None,
                        "end_date": None,
                        "location": location,
                        "is_online": is_online,
                        "prizes": "",
                        "themes": [],
                        "organizer": "MLH",
                        "status": "upcoming"
                    })
                except Exception as e:
                    logger.debug(f"Error parsing MLH event card: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error scraping MLH listing: {e}")
        
        return results
    
    def _extract_json_ld(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract JSON-LD structured data"""
        script = soup.find('script', type='application/ld+json')
        if script:
            try:
                return json.loads(script.string)
            except:
                pass
        return None
    
    def _parse_json_ld(self, data: Dict, url: str) -> Dict[str, Any]:
        """Parse JSON-LD data"""
        return {
            "name": data.get('name', ''),
            "description": data.get('description', ''),
            "url": url,
            "platform": HackathonPlatform.MLH,
            "start_date": self.parse_date(data.get('startDate', '')),
            "end_date": self.parse_date(data.get('endDate', '')),
            "location": data.get('location', {}).get('name'),
            "is_online": False,
            "prizes": "",
            "themes": [],
            "organizer": data.get('organizer', {}).get('name'),
            "status": self._determine_status(
                self.parse_date(data.get('startDate', '')),
                self.parse_date(data.get('endDate', ''))
            )
        }
    
    def _parse_html(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Parse HTML content"""
        # Extract hackathon name
        name = soup.find('h1')
        name = name.text.strip() if name else "Unknown"
        
        # Extract description
        description = ""
        desc_elem = soup.find('meta', {'name': 'description'})
        if desc_elem:
            description = desc_elem.get('content', '')
        
        # Extract dates
        dates = self._extract_dates(soup)
        
        # Extract location
        location = self._extract_location(soup)
        
        return {
            "name": name,
            "description": description,
            "url": url,
            "platform": HackathonPlatform.MLH,
            "start_date": dates[0],
            "end_date": dates[1],
            "location": location,
            "is_online": False,
            "prizes": "",
            "themes": [],
            "organizer": "MLH",
            "status": self._determine_status(dates[0], dates[1])
        }
    
    def _extract_dates(self, soup: BeautifulSoup) -> tuple:
        """Extract dates from MLH page"""
        date_pattern = r'(\w+\s+\d+-\d+,\s+\d{4})'
        text = soup.get_text()
        match = re.search(date_pattern, text)
        if match:
            date_range = match.group(1)
            # Parse date range (simplified)
            return self.parse_date(date_range.split('-')[0].strip()), None
        return None, None
    
    def _extract_location(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract location"""
        location_elem = soup.find('span', class_='location')
        if location_elem:
            return location_elem.text.strip()
        return None