from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Depends
from typing import List, Optional
from datetime import datetime
import uuid
import asyncio
import logging

from app.database.crud import HackathonCRUD
from app.models.hackathon import (
    ScrapeRequest, ScrapeResponse, HackathonUpdate, ScrapeResult
)
from app.scrapers import scrape_url, scrape_url_all, PLATFORM_URLS, ACTIVE_STATUSES
from app.cache.redis_cache import (
    get_cached_hackathon_list, cache_hackathon_list,
    get_cached_hackathon, cache_hackathon,
    invalidate_hackathon,
)

logger = logging.getLogger(__name__)
from app.security import require_service_token, allowed_scrape_url
router = APIRouter()

# Store for tracking scraping tasks (in production, use Redis/Celery)
scraping_tasks = {}


@router.post("/scrape", response_model=ScrapeResponse, dependencies=[Depends(require_service_token)])
async def scrape_hackathons(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
):
    """
    Scrape hackathon information from provided URLs
    """
    if not all(allowed_scrape_url(url) for url in request.urls):
        raise HTTPException(status_code=400, detail="Use HTTPS URLs from registered platforms or configured trusted hosts")
    task_id = str(uuid.uuid4())

    scraping_tasks[task_id] = {
        "status": "pending",
        "total": len(request.urls),
        "completed": 0,
        "results": []
    }

    background_tasks.add_task(
        process_scraping,
        task_id,
        request.urls,
        request.force_refresh,
    )

    return ScrapeResponse(
        task_id=task_id,
        status="pending",
        message=f"Started scraping {len(request.urls)} URLs",
        total_urls=len(request.urls)
    )


@router.post("/scrape-all", response_model=ScrapeResponse, dependencies=[Depends(require_service_token)])
async def scrape_all_platforms(background_tasks: BackgroundTasks):
    """
    Scrape ALL registered hackathon platforms at once.
    This triggers bulk scraping from all nine registered providers.
    """
    task_id = str(uuid.uuid4())

    scraping_tasks[task_id] = {
        "status": "pending",
        "total": len(PLATFORM_URLS),
        "completed": 0,
        "saved": 0,
        "errors": 0,
        "results": []
    }

    background_tasks.add_task(
        process_scraping_all,
        task_id,
    )

    return ScrapeResponse(
        task_id=task_id,
        status="pending",
        message=f"Started scraping {len(PLATFORM_URLS)} platforms",
        total_urls=len(PLATFORM_URLS)
    )


@router.get("/scrape/status/{task_id}", dependencies=[Depends(require_service_token)])
async def get_scrape_status(task_id: str):
    """
    Get status of a scraping task
    """
    if task_id not in scraping_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = scraping_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": f"{task['completed']}/{task['total']}",
        "saved": task.get("saved", 0),
        "errors": task.get("errors", 0),
        "results": task.get("results", [])
    }


@router.get("/hackathons")
async def get_hackathons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    platform: Optional[str] = None,
    status: Optional[str] = None,
    include_completed: bool = False,
):
    """
    Get all scraped hackathons with optional filters
    """
    # Try cache first
    cached = get_cached_hackathon_list(platform or "", status or "", skip, limit, include_completed)
    if cached is not None:
        return cached

    # Cache miss — fetch from Convex
    try:
        hackathons = await asyncio.to_thread(
            HackathonCRUD.get_all_hackathons,
            skip=skip, limit=limit, platform=platform, status=status,
        )
        if not include_completed and not status:
            hackathons = [h for h in hackathons if h.get("status") in ACTIVE_STATUSES]
    except Exception:
        logger.exception("Unable to load hackathons")
        raise HTTPException(status_code=503, detail="Hackathon data is temporarily unavailable")

    cache_hackathon_list(hackathons, platform or "", status or "", skip, limit, include_completed)
    return hackathons


@router.get("/hackathons/mnc")
async def get_mnc_hackathons(
    limit: int = Query(100, ge=1, le=1000),
    include_completed: bool = False,
):
    try:
        hackathons = await asyncio.to_thread(HackathonCRUD.get_mnc_hackathons, limit)
        if not include_completed:
            hackathons = [h for h in hackathons if h.get("status") in ACTIVE_STATUSES]
        return hackathons
    except Exception:
        logger.exception("Unable to load corporate hackathons")
        raise HTTPException(status_code=503, detail="Hackathon data is temporarily unavailable")


@router.get("/hackathons/{hackathon_id}")
async def get_hackathon(hackathon_id: str):
    """
    Get a specific hackathon by ID
    """
    cached = get_cached_hackathon(hackathon_id)
    if cached is not None:
        return cached

    hackathon = HackathonCRUD.get_hackathon(hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    cache_hackathon(hackathon_id, hackathon)
    return hackathon


@router.put("/hackathons/{hackathon_id}", dependencies=[Depends(require_service_token)])
async def update_hackathon(
    hackathon_id: str,
    update_data: HackathonUpdate,
):
    """
    Update hackathon information
    """
    hackathon = HackathonCRUD.update_hackathon(hackathon_id, update_data)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    invalidate_hackathon(hackathon_id=hackathon_id)
    return hackathon


@router.delete("/hackathons/{hackathon_id}", dependencies=[Depends(require_service_token)])
async def delete_hackathon(hackathon_id: str):
    """
    Delete a hackathon
    """
    deleted = HackathonCRUD.delete_hackathon(hackathon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    invalidate_hackathon(hackathon_id=hackathon_id)
    return {"message": "Hackathon deleted successfully"}


async def process_scraping(task_id: str, urls: List[str], force_refresh: bool):
    """
    Background task to process scraping individual URLs
    """
    scraping_tasks[task_id]["status"] = "in_progress"

    for url in urls:
        try:
            # Check if already exists and not forced refresh
            if not force_refresh:
                existing = HackathonCRUD.get_hackathon_by_url(url)
                if existing:
                    scraping_tasks[task_id]["results"].append({
                        "url": url,
                        "success": True,
                        "hackathon": existing,
                        "message": "Already exists"
                    })
                    scraping_tasks[task_id]["completed"] += 1
                    continue

            # Scrape new data (run sync scraper in thread)
            scraped_data = await asyncio.to_thread(scrape_url, url)

            if "error" in scraped_data:
                scraping_tasks[task_id]["results"].append({
                    "url": url,
                    "success": False,
                    "error": scraped_data["error"]
                })
            else:
                hackathon = HackathonCRUD.create_hackathon(
                    scraped_data,
                    scraped_from=url
                )

                if hackathon:
                    invalidate_hackathon(hackathon_id=hackathon.get("_id"), url=hackathon.get("url"))
                    scraping_tasks[task_id]["results"].append({
                        "url": url,
                        "success": True,
                        "hackathon": hackathon
                    })
                else:
                    scraping_tasks[task_id]["results"].append({
                        "url": url,
                        "success": False,
                        "error": "Failed to save to database (may already exist)"
                    })

        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
            scraping_tasks[task_id]["results"].append({
                "url": url,
                "success": False,
                "error": str(e)
            })

        scraping_tasks[task_id]["completed"] += 1

    scraping_tasks[task_id]["status"] = "completed"


async def process_scraping_all(task_id: str):
    """
    Background task: scrape ALL hackathon platforms and save everything to Convex.
    Uses scrape_url_all which returns multiple hackathons from listing pages.
    """
    scraping_tasks[task_id]["status"] = "in_progress"
    total_saved = 0
    total_errors = 0

    for platform_url in PLATFORM_URLS:
        try:
            logger.info(f"[scrape-all] Scraping platform: {platform_url}")

            # Scrape all hackathons from this platform (returns a list)
            results = await asyncio.to_thread(scrape_url_all, platform_url)
            logger.info(f"[scrape-all] Got {len(results)} hackathons from {platform_url}")
            if not results:
                raise RuntimeError("No events extracted; the listing may be empty or the provider unavailable")

            for hackathon_data in results:
                try:
                    if hackathon_data.get("status") not in ACTIVE_STATUSES:
                        logger.info("[scrape-all] Skipping completed event: %s", hackathon_data.get("url"))
                        continue
                    # Save to Convex
                    saved = HackathonCRUD.create_hackathon(
                        hackathon_data,
                        scraped_from=platform_url
                    )
                    if saved:
                        total_saved += 1
                        scraping_tasks[task_id]["results"].append({
                            "url": hackathon_data.get("url", platform_url),
                            "name": hackathon_data.get("name", "Unknown"),
                            "platform": hackathon_data.get("platform", "unknown"),
                            "success": True,
                        })
                    else:
                        total_errors += 1
                except Exception as e:
                    logger.error(f"[scrape-all] Error saving hackathon: {e}")
                    total_errors += 1

        except Exception as e:
            logger.error(f"[scrape-all] Error scraping {platform_url}: {e}")
            scraping_tasks[task_id]["results"].append({
                "url": platform_url,
                "success": False,
                "error": str(e),
            })
            total_errors += 1

        scraping_tasks[task_id]["completed"] += 1
        scraping_tasks[task_id]["saved"] = total_saved
        scraping_tasks[task_id]["errors"] = total_errors

    # Invalidate list cache once after all saves
    invalidate_hackathon()

    scraping_tasks[task_id]["status"] = "completed"
    logger.info(f"[scrape-all] Done! Saved {total_saved}, Errors {total_errors}")
