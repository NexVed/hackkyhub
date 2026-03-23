from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from app.database.crud import init_db
from app.cache.redis_cache import init_redis
from app.api.routes import router
from app.scheduler import setup_scheduler, scheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    await init_db()       # Initialize Convex client
    init_redis()          # Initialize Upstash Redis client
    
    # Initialize and start the APScheduler
    setup_scheduler()
    scheduler.start()
    
    yield
    # Shutdown
    logger.info("Shutting down...")
    scheduler.shutdown()


app = FastAPI(
    title="Hackathon Scraper Microservice",
    description="Service for scraping hackathon information from various websites",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Hackathon Scraper Microservice",
        "version": "1.0.0",
        "database": "Convex",
        "cache": "Upstash Redis",
        "endpoints": [
            "/api/v1/scrape",
            "/api/v1/hackathons",
            "/api/v1/hackathons/{id}",
            "/api/v1/health"
        ]
    }


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}