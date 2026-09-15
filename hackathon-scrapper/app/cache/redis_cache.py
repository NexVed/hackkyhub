from upstash_redis import Redis
from typing import Optional, Any
import json
import os
import logging

logger = logging.getLogger(__name__)

# Redis client — initialized on startup
_redis: Optional[Redis] = None

# Cache TTLs (seconds)
LIST_TTL = 300       # 5 minutes for list queries
DETAIL_TTL = 600     # 10 minutes for individual lookups
URL_LOOKUP_TTL = 600 # 10 minutes for URL-based lookups


def get_redis_client() -> Optional[Redis]:
    """Get or create the Upstash Redis client singleton"""
    global _redis
    if _redis is None:
        url = os.getenv("UPSTASH_REDIS_REST_URL")
        token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        if not url or not token:
            logger.warning(
                "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. "
                "Caching is disabled."
            )
            return None
        _redis = Redis(url=url, token=token)
        logger.info("Upstash Redis client initialized")
    return _redis


def init_redis():
    """Initialize Redis connection (called on app startup)"""
    client = get_redis_client()
    if client:
        try:
            client.ping()
            logger.info("Upstash Redis connection verified")
        except Exception as e:
            logger.warning(f"Redis ping failed: {e}. Caching will be disabled.")


def _make_key(prefix: str, *parts: str) -> str:
    """Build a cache key"""
    return f"scraper:{prefix}:{':'.join(parts)}"


def get_cached(key: str) -> Optional[Any]:
    """Get a value from cache, returns None on miss or error"""
    client = get_redis_client()
    if not client:
        return None
    try:
        data = client.get(key)
        if data is None:
            return None
        if isinstance(data, str):
            return json.loads(data)
        return data
    except Exception as e:
        logger.debug(f"Cache miss/error for {key}: {e}")
        return None


def set_cached(key: str, value: Any, ttl: int = LIST_TTL):
    """Set a value in cache with TTL"""
    client = get_redis_client()
    if not client:
        return
    try:
        client.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception as e:
        logger.debug(f"Cache set error for {key}: {e}")


def invalidate_pattern(prefix: str):
    """Invalidate all keys matching a prefix pattern.
    
    Note: Upstash REST API doesn't support SCAN/KEYS, so we
    invalidate specific known key patterns instead.
    """
    client = get_redis_client()
    if not client:
        return
    try:
        # Invalidate the list cache
        client.incr("scraper:hackathons:generation")
        logger.debug(f"Invalidated cache for prefix: {prefix}")
    except Exception as e:
        logger.debug(f"Cache invalidation error: {e}")


def invalidate_hackathon(hackathon_id: Optional[str] = None, url: Optional[str] = None):
    """Invalidate caches related to a specific hackathon"""
    client = get_redis_client()
    if not client:
        return
    try:
        client.incr("scraper:hackathons:generation")
        keys_to_delete = []
        if hackathon_id:
            keys_to_delete.append(_make_key("hackathon", hackathon_id))
        if url:
            keys_to_delete.append(_make_key("hackathon_url", url))
        if keys_to_delete:
            client.delete(*keys_to_delete)
    except Exception as e:
        logger.debug(f"Cache invalidation error: {e}")


# Convenience functions for hackathon-specific caching
def cache_hackathon_list(hackathons: list, platform: str = "", status: str = "", skip: int = 0, limit: int = 100, include_completed: bool = False):
    """Cache the hackathon list response"""
    generation = str(get_cached("scraper:hackathons:generation") or 0)
    key = _make_key("hackathons", "list", generation, platform, status, str(skip), str(limit), str(include_completed))
    set_cached(key, hackathons, ttl=LIST_TTL)


def get_cached_hackathon_list(platform: str = "", status: str = "", skip: int = 0, limit: int = 100, include_completed: bool = False) -> Optional[list]:
    """Get cached hackathon list"""
    generation = str(get_cached("scraper:hackathons:generation") or 0)
    key = _make_key("hackathons", "list", generation, platform, status, str(skip), str(limit), str(include_completed))
    return get_cached(key)


def cache_hackathon(hackathon_id: str, data: dict):
    """Cache a single hackathon lookup"""
    key = _make_key("hackathon", hackathon_id)
    set_cached(key, data, ttl=DETAIL_TTL)


def get_cached_hackathon(hackathon_id: str) -> Optional[dict]:
    """Get a cached hackathon"""
    key = _make_key("hackathon", hackathon_id)
    return get_cached(key)


def cache_hackathon_by_url(url: str, data: dict):
    """Cache a hackathon lookup by URL"""
    key = _make_key("hackathon_url", url)
    set_cached(key, data, ttl=URL_LOOKUP_TTL)


def get_cached_hackathon_by_url(url: str) -> Optional[dict]:
    """Get cached hackathon by URL"""
    key = _make_key("hackathon_url", url)
    return get_cached(key)
