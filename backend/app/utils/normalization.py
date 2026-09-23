"""Shared, deterministic normalization at the scraper/storage boundary."""
import math
import re
from html import unescape
from datetime import datetime, timezone
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, urlencode

PLATFORM_LOGOS = {
    "devfolio": "devfolio-icon-filled-256.png", "hackerearth": "hackerearth.jpg",
    "unstop": "unstop-icon-800x800.png", "mlh": "mlh-logo-color.png",
    "devpost": "devpost.png", "hack2skill": "hack2skill.png",
    "devnovate": "devnovate.svg.DEVNOVATE.Woblo.svg",
    "commudle": "commudle-logo192.png", "hackculture": "hackculture.png",
}

def belongs_to(url, domain):
    host = (urlsplit(url).hostname or "").lower()
    return host == domain or host.endswith("." + domain)

def http_url(value, base=""):
    if isinstance(value, dict):
        value = next((value[k] for k in ("url", "image_url", "src", "contentUrl") if value.get(k)), None)
    if isinstance(value, list):
        return next((u for v in value if (u := http_url(v, base))), None)
    if not isinstance(value, str) or not value.strip() or value.strip() in (".", "#"):
        return None
    url = urljoin(base, value.strip())
    try:
        parts = urlsplit(url)
        if parts.scheme in ("http", "https") and parts.hostname and not parts.username and not parts.password:
            return url
    except ValueError:
        pass
    return None

def redirect_url(url, platform):
    parts = urlsplit(url)
    tags = {"utm_source": "hackkyhub"}
    if platform in ("devfolio", "unstop", "commudle", "hackculture"):
        tags = {"ref": "hackkyhub"}
    elif platform == "devpost":
        tags = {"ref_feature": "challenge", "ref_medium": "hackkyhub"}
    elif platform == "mlh" and not belongs_to(url, "mlh.io"):
        tags["ref"] = "mlh"
    pairs = parse_qsl(parts.query, keep_blank_values=True)
    keys = {k for k, _ in pairs}
    pairs.extend((k, v) for k, v in tags.items() if k not in keys)
    return urlunsplit(parts._replace(query=urlencode(pairs)))

def parse_date(value):
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        try:
            dt = datetime.fromtimestamp(value / 1000 if value > 1e11 else value, timezone.utc)
        except (ValueError, OverflowError, OSError):
            return None
    elif isinstance(value, str) and value.strip():
        value = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", value.strip())
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d/%m/%y", "%B %d, %Y", "%b %d, %Y"):
                try:
                    dt = datetime.strptime(value, fmt)
                    break
                except ValueError:
                    continue
            else:
                return None
    else:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)

def date_status(start, end, fallback="upcoming"):
    start, end = parse_date(start), parse_date(end)
    now = datetime.now(timezone.utc)
    if end and now > end:
        return "completed"
    if start:
        return "upcoming" if now < start else "ongoing"
    return fallback if fallback in ("upcoming", "ongoing", "completed") else "upcoming"

def prize_value(value, default_currency=None):
    """Only attach an amount to monetary rewards; fees and swag are not prizes."""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return (float(value), default_currency) if math.isfinite(value) and value >= 0 else (None, None)
    if not isinstance(value, str) or re.search(r"\b(entry|fee|ticket)\b", value, re.I):
        return None, None
    currencies = [(r"₹|\bINR\b|\bRs\.?", "INR"), (r"\$|\bUSD\b", "USD"), (r"€|\bEUR\b", "EUR"), (r"£|\bGBP\b", "GBP")]
    found = [(pattern, code) for pattern, code in currencies if re.search(pattern, value, re.I)]
    if len(found) > 1:
        return None, None  # Never combine unlike currencies.
    currency = found[0][1] if found else default_currency
    if not currency:
        return None, None
    money = r"([\d,]+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|billion|k|m)?\b"
    match = re.search(r"(?:" + found[0][0] + r")\s*" + money, value, re.I) if found else None
    if not match:
        match = re.search(money + r"\s*(?:" + found[0][0] + r")", value, re.I) if found else re.fullmatch(money, value.strip(), re.I)
    if not match:
        return None, currency
    amount = float(match.group(1).replace(",", ""))
    unit = (match.group(2) or "").lower()
    multiplier = 1e7 if unit.startswith(("cr",)) else 1e5 if unit.startswith(("lak", "lac")) else {"k": 1e3, "m": 1e6, "million": 1e6, "billion": 1e9}.get(unit, 1)
    return amount * multiplier, currency

MNC_NAMES = (
    "Google", "Microsoft", "Amazon", "AWS", "Meta", "Apple", "IBM", "Oracle", "Intel", "AMD", "NVIDIA", "Cisco", "Adobe", "Salesforce",
    "Goldman Sachs", "Morgan Stanley", "JPMorgan Chase", "Deloitte", "McKinsey", "PwC", "EY", "American Express",
    "Tata", "TCS", "Reliance", "Infosys", "Wipro", "Flipkart", "Walmart", "Schneider", "L&T", "TVS", "Hero", "Airtel", "L'Oreal", "L’Oréal",
    "Imagine Cup", "Smart India Hackathon", "SIH",
)

def is_mnc(*values):
    text = " ".join(str(v) for v in values if v)
    return any(re.search(r"(?<!\w)" + re.escape(name) + r"(?!\w)", text, re.I) for name in MNC_NAMES)

def normalize_record(record, source=None):
    if "error" in record:
        return record
    result = dict(record)
    platform = getattr(result.get("platform", "custom"), "value", result.get("platform", "custom"))
    result["platform"] = platform
    for key in ("name", "description", "organizer"):
        if isinstance(result.get(key), str):
            result[key] = re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", result[key]))).strip()
    url = http_url(result.get("url"), source or "")
    if not url or not result.get("name"):
        return {"error": "Event is missing a name or valid HTTP URL"}
    result["url"] = url
    result["redirect_url"] = redirect_url(http_url(result.get("redirect_url"), url) or url, platform)
    result["platform_logo"] = "/hackathons-logo/" + PLATFORM_LOGOS[platform] if platform in PLATFORM_LOGOS else "/favicon.ico"
    for key in ("banner_url", "logo_url"):
        result[key] = http_url(result.get(key), url)
    for key in ("start_date", "end_date", "registration_deadline"):
        dt = parse_date(result.get(key))
        result[key] = dt.isoformat() if dt else None
    result["status"] = date_status(result.get("start_date"), result.get("end_date"), result.get("status"))
    result.setdefault("is_online", False)
    result["is_mnc"] = bool(result.get("is_mnc")) or is_mnc(result.get("name"), result.get("organizer"), result.pop("sponsors", None))
    if isinstance(result.get("prizes"), (dict, list)):
        # Unstructured reward objects must not leak into display strings or monetary totals.
        result.pop("prizes")
    amount, currency = prize_value(result.get("prizes"), result.get("prize_currency"))
    if result.get("prize_amount") is None:
        result["prize_amount"] = amount
    result["prize_currency"] = currency or result.get("prize_currency")
    if result.get("prizes") is not None:
        result["prizes"] = str(result["prizes"])
    for key in ("registered_count", "view_count"):
        try:
            result[key] = max(0, int(str(result[key]).replace(",", ""))) if result.get(key) is not None else None
        except (ValueError, TypeError):
            result[key] = None
    result["scraped_from"] = source or result.get("scraped_from") or url
    return {k: v for k, v in result.items() if v is not None}
