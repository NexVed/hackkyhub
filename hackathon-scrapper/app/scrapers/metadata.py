"""Public page metadata and event cards shared by provider fallbacks."""
import json
import re
from app.utils.normalization import http_url, parse_date

def text_at(node, selector):
    found = node.select_one(selector)
    return found.get_text(" ", strip=True) if found else None

def image_at(node, selector, base):
    found = node.select_one(selector)
    if not found:
        return None
    value = found.get("src") or found.get("data-src") or found.get("content")
    if not value:
        match = re.search(r"url\(['\"]?(.*?)['\"]?\)", found.get("style", ""))
        value = match.group(1) if match else None
    return http_url(value, base)

def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)

def structured_events(soup):
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            for item in objects(json.loads(script.string or script.get_text())):
                types = item.get("@type", [])
                types = [types] if isinstance(types, str) else types
                if any(t in ("Event", "Hackathon", "EducationEvent", "BusinessEvent", "SocialEvent") for t in types):
                    yield item
        except (ValueError, TypeError):
            continue

def entity_name(value):
    if isinstance(value, dict):
        return value.get("name") or value.get("title")
    if isinstance(value, list):
        return ", ".join(filter(None, (entity_name(v) for v in value)))
    return value if isinstance(value, str) else None

def event_metadata(item, url):
    location = item.get("location")
    locations = location if isinstance(location, list) else [location]
    online = "OnlineEventAttendanceMode" in str(item.get("eventAttendanceMode", ""))
    labels = []
    for loc in locations:
        if isinstance(loc, str):
            labels.append(loc)
        elif isinstance(loc, dict):
            online |= loc.get("@type") == "VirtualLocation"
            address = loc.get("address")
            if isinstance(address, dict):
                labels.append(", ".join(str(address[k]) for k in ("addressLocality", "addressRegion", "addressCountry") if isinstance(address.get(k), str)))
            elif isinstance(address, str):
                labels.append(address)
            elif loc.get("name"):
                labels.append(loc["name"])
    organizer = item.get("organizer")
    return {
        "name": item.get("name"), "description": item.get("description"),
        "url": http_url(item.get("url"), url) or url,
        "banner_url": http_url(item.get("image"), url),
        "logo_url": http_url(organizer.get("logo"), url) if isinstance(organizer, dict) else None,
        "organizer": entity_name(organizer), "sponsors": entity_name(item.get("sponsor")),
        "start_date": item.get("startDate"), "end_date": item.get("endDate"),
        "location": ", ".join(filter(None, labels)) or ("Online" if online else None),
        "is_online": online,
        # Schema.org offers are admission prices, never the prize pool.
    }

def page_metadata(soup, url):
    url = getattr(soup, "_source_url", None) or url
    def meta(*selectors):
        for selector in selectors:
            tag = soup.select_one(selector)
            if tag and tag.get("content"):
                return tag["content"]
        return None
    canonical = soup.select_one('link[rel="canonical"]')
    icon = soup.select_one('link[rel~="icon"], link[rel="apple-touch-icon"]')
    data = {
        "name": meta('meta[property="og:title"]', 'meta[name="twitter:title"]') or text_at(soup, "h1, title"),
        "description": meta('meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]'),
        "url": http_url(canonical.get("href") if canonical else meta('meta[property="og:url"]'), url) or url,
        "redirect_url": url,
        "banner_url": http_url(meta('meta[property="og:image"]', 'meta[name="twitter:image"]'), url),
        "logo_url": http_url(icon.get("href"), url) if icon else None,
        "prizes": text_at(soup, ".prize-amount, .prizes, #prizes, .prize-pool"),
        "organizer": text_at(soup, ".organizer, .host-name"),
        "themes": [n.get_text(strip=True) for n in soup.select(".theme-label, .theme")],
    }
    event = next(structured_events(soup), None)
    if event:
        structured = event_metadata(event, url)
        if not http_url(event.get("url"), url):
            structured.pop("url", None)
        data.update({k: v for k, v in structured.items() if v is not None})
    else:
        data["start_date"], data["end_date"] = date_range(text_at(soup, ".event-date, .date, .submission-period"))
        data["location"] = text_at(soup, ".event-location, .location, .venue")
        data["is_online"] = bool(re.search(r"\b(online|virtual|digital|hybrid)\b", data.get("location") or "", re.I))
    data["logo_url"] = image_at(soup, ".organizer-logo img, img.organizer-logo, .company-details img", url) or data.get("logo_url")
    if not data.get("banner_url"):
        data["banner_url"] = image_at(soup, ".featured-image img, .event-image img, #challenge-header[style]", url)
    return data

def date_range(text, year=None):
    if not text:
        return None, None
    clean = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", text)
    match = re.search(r"([A-Za-z]+)\s+(\d{1,2})\s*[-–—]\s*(?:([A-Za-z]+)\s+)?(\d{1,2}),?\s*(\d{4})?", clean)
    if match and (match[5] or year):
        end_year = int(match[5] or year)
        end = parse_date(f"{match[3] or match[1]} {match[4]}, {end_year}")
        start = parse_date(f"{match[1]} {match[2]}, {end_year}")
        if start and end and start > end:
            start = start.replace(year=end_year - 1)
        return start, end
    return parse_date(clean), None

def parse_card(card, url, platform, year=None):
    link = card if card.name == "a" and card.get("href") else card.select_one("a.event-link[href], a.challenge-card-link[href], a[href]")
    target = http_url(link.get("href"), url) if link else None
    name = text_at(card, ".event-name, .challenge-name, .challenge-list-title, h2, h3, h4, .title")
    if not name and link:
        name = link.get("title") or link.get_text(" ", strip=True)
    if not name or not target or target.rstrip("/") == url.rstrip("/"):
        return None
    start = card.select_one('[itemprop="startDate"], time.start, [data-start-time]')
    end = card.select_one('[itemprop="endDate"], time.end, [data-end-time]')
    start_date, end_date = date_range(text_at(card, ".event-date, .date, .submission-period"), year)
    if start:
        start_date = start.get("content") or start.get("datetime") or start.get("data-start-time") or start_date
    if end:
        end_date = end.get("content") or end.get("datetime") or end.get("data-end-time") or end_date
    location = text_at(card, ".event-location, .location, .venue")
    online = bool(re.search(r"\b(online|virtual|digital|hybrid)\b", location or card.get_text(" ", strip=True), re.I))
    return {
        "name": name, "url": target, "platform": platform,
        "description": text_at(card, ".description, .tagline, .subtitle"),
        "banner_url": image_at(card, ".image-wrap img, .hackathon-thumbnail img, .event-image img, img.event-banner, .banner img, [style*='background-image'], img", url),
        "logo_url": image_at(card, ".event-logo img, .organizer-logo img, img.organizer-logo, .company-details img, .community-logo img", url),
        "prizes": text_at(card, ".prize-amount, .prize, .prizes, .prize-pool"),
        "organizer": text_at(card, ".organizer, .company-name, .host-name, .community-name"),
        "themes": [n.get_text(strip=True) for n in card.select(".theme-label, .theme")],
        "start_date": start_date, "end_date": end_date,
        "location": location or ("Online" if online else None), "is_online": online,
    }
