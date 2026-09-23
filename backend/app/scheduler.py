import logging
import uuid
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.api.routes import process_scraping_all, scraping_tasks
from app.scrapers import PLATFORM_URLS

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def scheduled_scrape():
    """Background job to trigger scrape-all 3 days a week."""
    logger.info("Starting scheduled scrape-all job...")
    task_id = str(uuid.uuid4())
    
    # Initialize the tracking state just like the HTTP endpoint does
    scraping_tasks[task_id] = {
        "status": "pending",
        "total": len(PLATFORM_URLS),
        "completed": 0,
        "saved": 0,
        "errors": 0,
        "results": [],
        "skipped": 0,
    }
    
    # Run the actual scraping logic
    await process_scraping_all(task_id)
    
    # Log the final results
    task = scraping_tasks.get(task_id, {})
    logger.info(f"Scheduled scrape-all {task_id} completed: Saved={task.get('saved', 0)}, Errors={task.get('errors', 0)}")

def setup_scheduler():
    """Configure the scheduler to run 3 days a week (Mon, Wed, Fri at 02:00 UTC)."""
    scheduler.add_job(
        scheduled_scrape,
        CronTrigger(day_of_week='mon,wed,fri', hour=2, minute=0),
        id="weekly_scrape_job",
        replace_existing=True
    )
    logger.info("Configured APScheduler: scheduled_scrape runs every Mon, Wed, Fri at 02:00 UTC")
