from typing import List, Tuple
import re
from urllib.parse import urlparse

def validate_urls(urls: List[str]) -> Tuple[List[str], List[str]]:
    """
    Validate URLs and return (valid_urls, invalid_urls)
    """
    valid_urls = []
    invalid_urls = []
    
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    for url in urls:
        url = url.strip()
        if url_pattern.match(url):
            # Additional validation
            parsed = urlparse(url)
            if parsed.scheme in ['http', 'https'] and parsed.netloc:
                valid_urls.append(url)
            else:
                invalid_urls.append(url)
        else:
            invalid_urls.append(url)
    
    return valid_urls, invalid_urls

def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    parsed = urlparse(url)
    return parsed.netloc

def is_same_domain(url1: str, url2: str) -> bool:
    """Check if two URLs are from the same domain"""
    return extract_domain(url1) == extract_domain(url2)