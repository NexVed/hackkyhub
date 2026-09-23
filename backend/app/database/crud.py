from convex import ConvexClient
from typing import Optional, List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
import os
import logging

from app.models.hackathon import HackathonCreate, HackathonUpdate
from app.utils.normalization import normalize_record

logger = logging.getLogger(__name__)

# Load .env.local first (created by npx convex dev), then .env as fallback
load_dotenv(".env.local", override=True)
load_dotenv(".env")

# Convex client â€” initialized on startup
_client: Optional[ConvexClient] = None


def _resolve_convex_url() -> str:
    """Resolve the Convex URL from environment variables.
    
    npx convex dev writes CONVEX_DEPLOYMENT=dev:slug-name-123 to .env.local
    We convert that to https://slug-name-123.convex.cloud
    """
    # First try the direct URL (user-set)
    convex_url = os.getenv("CONVEX_URL")
    if convex_url and "your-project" not in convex_url:
        return convex_url

    # Then try CONVEX_DEPLOYMENT (set by npx convex dev)
    deployment = os.getenv("CONVEX_DEPLOYMENT", "")
    if deployment:
        # Format: "dev:slug-name-123" or "prod:slug-name-123"
        slug = deployment.split(":", 1)[-1] if ":" in deployment else deployment
        url = f"https://{slug}.convex.cloud"
        logger.info(f"Resolved Convex URL from CONVEX_DEPLOYMENT: {url}")
        return url

    raise RuntimeError(
        "No Convex URL found. Either:\n"
        "  1. Run 'npx convex dev' (creates .env.local with CONVEX_DEPLOYMENT), or\n"
        "  2. Set CONVEX_URL in your .env file"
    )


def get_convex_client() -> ConvexClient:
    """Get or create the Convex client singleton"""
    global _client
    if _client is None:
        convex_url = _resolve_convex_url()
        _client = ConvexClient(convex_url)
        logger.info(f"Convex client initialized: {convex_url}")
    return _client


async def init_db():
    """Initialize Convex client connection (replaces SQLAlchemy init)"""
    get_convex_client()
    logger.info("Convex database connection established")


class HackathonCRUD:
    @staticmethod
    def _get_client() -> ConvexClient:
        return get_convex_client()

    @staticmethod
    def create_hackathon(hackathon_data: dict, scraped_from: str) -> Optional[Dict[str, Any]]:
        """Create a new hackathon entry"""
        client = HackathonCRUD._get_client()
        try:
            normalized = normalize_record(hackathon_data, scraped_from)
            if "error" in normalized:
                raise ValueError(normalized["error"])
            data = HackathonCreate.model_validate(normalized).model_dump(exclude_none=True)
            data["scraped_from"] = scraped_from

            result = client.mutation("hackathons:create", data)
            return result
        except Exception as e:
            logger.error(f"Error creating hackathon: {e}")
            return None

    @staticmethod
    def get_hackathon(hackathon_id: str) -> Optional[Dict[str, Any]]:
        """Get hackathon by Convex ID"""
        client = HackathonCRUD._get_client()
        try:
            return client.query("hackathons:getById", {"id": hackathon_id})
        except Exception as e:
            logger.error(f"Error fetching hackathon {hackathon_id}: {e}")
            return None

    @staticmethod
    def get_hackathon_by_url(url: str) -> Optional[Dict[str, Any]]:
        """Get hackathon by URL"""
        client = HackathonCRUD._get_client()
        try:
            return client.query("hackathons:getByUrl", {"url": url})
        except Exception as e:
            logger.error(f"Error fetching hackathon by URL: {e}")
            return None

    @staticmethod
    def update_hackathon(hackathon_id: str, update_data: HackathonUpdate) -> Optional[Dict[str, Any]]:
        """Update hackathon information"""
        client = HackathonCRUD._get_client()
        try:
            data = {"id": hackathon_id}
            for key, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    if isinstance(value, datetime):
                        data[key] = value.isoformat()
                    else:
                        data[key] = value
            return client.mutation("hackathons:update", data)
        except Exception as e:
            logger.error(f"Error updating hackathon {hackathon_id}: {e}")
            return None

    @staticmethod
    def get_all_hackathons(
        skip: int = 0,
        limit: int = 100,
        platform: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get all hackathons with optional filters"""
        client = HackathonCRUD._get_client()
        try:
            params: Dict[str, Any] = {"limit": skip + limit}
            if platform:
                params["platform"] = platform
            if status:
                params["status"] = status

            results = client.query("hackathons:getAll", params)
            if results and skip > 0:
                results = results[skip:skip + limit]
            return results or []
        except Exception as e:
            logger.error(f"Error fetching hackathons: {e}")
            raise

    @staticmethod
    def get_mnc_hackathons(limit: int = 100) -> List[Dict[str, Any]]:
        # Let API callers distinguish an unavailable database from an empty list.
        return HackathonCRUD._get_client().query("hackathons:getMNC", {"limit": limit})

    @staticmethod
    def delete_hackathon(hackathon_id: str) -> bool:
        """Delete hackathon by ID"""
        client = HackathonCRUD._get_client()
        try:
            return client.mutation("hackathons:remove", {"id": hackathon_id})
        except Exception as e:
            logger.error(f"Error deleting hackathon {hackathon_id}: {e}")
            return False