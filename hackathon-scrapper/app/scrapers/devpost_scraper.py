from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from datetime import datetime
import logging

from app.scrapers.base_scraper import BaseScraper
from app.models.hackathon import HackathonPlatform

logger = logging.getLogger(__name__)

class DevpostScraper(BaseScraper):
    """Scraper for Devpost hackathons"""
    
    def can_handle(self, url: str) -> bool:
        """Check if URL is from Devpost"""
        return "devpost.com" in url.lower()
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """Scrape hackathon information from Devpost"""
        logger.info(f"Scraping Devpost URL: {url}")
        
        # If it's the listing page, return the first result
        if url.rstrip("/").endswith("/hackathons") or "devpost.com/hackathons?" in url:
            results = self._scrape_listing_page_all(url)
            if results:
                return results[0]
            return {"error": "No hackathons found on listing page"}
        
        # Otherwise scrape a single hackathon detail page
        return self._scrape_detail_page(url)

    def _scrape_listing_page_all(self, url: str) -> list:
        """Scrape ALL hackathon cards from the Devpost listing page."""
        soup = self.get_soup(url)
        if not soup:
            return []
        
        results = []
        try:
            # Devpost listing page has hackathon cards with class "hackathon-tile"
            tiles = soup.find_all('a', class_='hackathon-tile') or \
                    soup.find_all('div', class_='hackathon-tile') or \
                    soup.find_all('a', class_=re.compile(r'tile|card'))
            
            if not tiles:
                # Fallback: find links to individual hackathon pages
                tiles = soup.find_all('a', href=re.compile(r'devpost\.com/.*?/project-gallery|\.devpost\.com'))
            
            for tile in tiles[:20]:
                try:
                    # Extract name
                    name_elem = tile.find(['h2', 'h3', 'h4', 'strong', 'span'], class_=re.compile(r'title|name|heading'))
                    if not name_elem:
                        name_elem = tile.find(['h2', 'h3', 'h4'])
                    name = name_elem.get_text(strip=True) if name_elem else tile.get_text(strip=True)[:80]
                    
                    if not name or len(name) < 3:
                        continue
                    
                    # Extract URL
                    href = tile.get('href', '')
                    if href and not href.startswith('http'):
                        href = f"https://devpost.com{href}"
                    hackathon_url = href or url
                    
                    # Extract description
                    desc_elem = tile.find(['p', 'div'], class_=re.compile(r'desc|tagline|subtitle'))
                    description = desc_elem.get_text(strip=True)[:300] if desc_elem else ""
                    
                    # Location / online status
                    tile_text = tile.get_text().lower()
                    is_online = 'online' in tile_text or 'virtual' in tile_text
                    
                    # Prize info
                    prize_text = ""
                    prize_elem = tile.find(string=re.compile(r'\$[\d,]+'))
                    if prize_elem:
                        prize_text = prize_elem.strip()
                    
                    results.append({
                        "name": name,
                        "description": description,
                        "url": hackathon_url,
                        "platform": HackathonPlatform.DEVPOST,
                        "start_date": None,
                        "end_date": None,
                        "location": "Online" if is_online else None,
                        "is_online": is_online,
                        "prizes": prize_text,
                        "themes": [],
                        "organizer": "",
                        "status": "upcoming"
                    })
                except Exception as e:
                    logger.debug(f"Error parsing Devpost tile: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Error scraping Devpost listing: {e}")
        
        return results

    def _scrape_detail_page(self, url: str) -> Dict[str, Any]:
        """Scrape a single hackathon detail page on Devpost"""
        soup = self.get_soup(url)
        if not soup:
            return {"error": "Failed to fetch page"}
        
        try:
            name = self._extract_name(soup)
            description = self._extract_description(soup)
            start_date, end_date = self._extract_dates(soup)
            location, is_online = self._extract_location(soup)
            prizes = self._extract_prizes(soup)
            themes = self._extract_themes(soup)
            organizer = self._extract_organizer(soup)
            
            return {
                "name": name,
                "description": description,
                "url": url,
                "platform": HackathonPlatform.DEVPOST,
                "start_date": start_date,
                "end_date": end_date,
                "location": location,
                "is_online": is_online,
                "prizes": prizes,
                "themes": themes,
                "organizer": organizer,
                "status": self._determine_status(start_date, end_date)
            }
            
        except Exception as e:
            logger.error(f"Error scraping Devpost URL {url}: {str(e)}")
            return {"error": str(e)}
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract hackathon name"""
        name_elem = soup.find('h1', {'id': 'title'}) or soup.find('h1', class_='title')
        return name_elem.text.strip() if name_elem else "Unknown"
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract hackathon description"""
        desc_elem = soup.find('div', class_='challenge-description')
        if desc_elem:
            return desc_elem.text.strip()
        return ""
    
    def _extract_dates(self, soup: BeautifulSoup) -> tuple:
        """Extract start and end dates"""
        date_section = soup.find('div', class_='date')
        if date_section:
            dates = date_section.text.strip()
            # Parse dates (format varies)
            date_pattern = r'(\w+\s+\d+,\s+\d{4})'
            matches = re.findall(date_pattern, dates)
            if len(matches) >= 2:
                start = self.parse_date(matches[0])
                end = self.parse_date(matches[1])
                return start, end
        return None, None
    
    def _extract_location(self, soup: BeautifulSoup) -> tuple:
        """Extract location and online status"""
        location_elem = soup.find('div', class_='location')
        if location_elem:
            location_text = location_elem.text.strip().lower()
            is_online = 'online' in location_text or 'virtual' in location_text
            return location_elem.text.strip(), is_online
        return None, False
    
    def _extract_prizes(self, soup: BeautifulSoup) -> str:
        """Extract prize information"""
        prize_section = soup.find('div', class_='prizes')
        if prize_section:
            return prize_section.text.strip()
        return ""
    
    def _extract_themes(self, soup: BeautifulSoup) -> list:
        """Extract hackathon themes"""
        themes = []
        theme_elements = soup.find_all('span', class_='theme')
        for elem in theme_elements:
            themes.append(elem.text.strip())
        return themes
    
    def _extract_organizer(self, soup: BeautifulSoup) -> str:
        """Extract organizer information"""
        organizer_elem = soup.find('div', class_='organizer')
        if organizer_elem:
            return organizer_elem.text.strip()
        return ""
    
    def _determine_status(self, start_date: Optional[datetime], end_date: Optional[datetime]) -> str:
        """Determine hackathon status based on dates"""
        now = datetime.now()
        
        if not start_date or not end_date:
            return "upcoming"
        
        if now < start_date:
            return "upcoming"
        elif start_date <= now <= end_date:
            return "ongoing"
        else:
            return "completed"