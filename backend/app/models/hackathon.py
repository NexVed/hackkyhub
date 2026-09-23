from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class HackathonPlatform(str, Enum):
    DEVPOST = "devpost"
    MLH = "mlh"
    UNSTOP = "unstop"
    HACK2SKILL = "hack2skill"
    DEVNOVATE = "devnovate"
    DEVFOLIO = "devfolio"
    HACKEREARTH = "hackerearth"
    COMMUDLE = "commudle"
    HACKCULTURE = "hackculture"
    CUSTOM = "custom"


class HackathonBase(BaseModel):
    slug: Optional[str] = None
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    platform_logo: Optional[str] = None
    redirect_url: Optional[str] = None
    prize_amount: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    prize_currency: Optional[str] = None
    registration_deadline: Optional[str] = None
    registered_count: Optional[int] = Field(default=None, ge=0)
    view_count: Optional[int] = Field(default=None, ge=0)
    is_mnc: bool = False
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    url: str = Field(..., max_length=1000)
    platform: str = Field(..., max_length=50)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    is_online: bool = False
    prizes: Optional[str] = None
    themes: Optional[List[str]] = None
    organizer: Optional[str] = None
    status: str = "upcoming"


class HackathonCreate(HackathonBase):
    """Schema for creating a hackathon"""
    pass


class HackathonUpdate(BaseModel):
    """Schema for updating a hackathon (all fields optional)"""
    slug: Optional[str] = None
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    platform_logo: Optional[str] = None
    redirect_url: Optional[str] = None
    prize_amount: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    prize_currency: Optional[str] = None
    registration_deadline: Optional[str] = None
    registered_count: Optional[int] = Field(default=None, ge=0)
    view_count: Optional[int] = Field(default=None, ge=0)
    is_mnc: Optional[bool] = None
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    platform: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    is_online: Optional[bool] = None
    prizes: Optional[str] = None
    themes: Optional[List[str]] = None
    organizer: Optional[str] = None
    status: Optional[str] = None


class HackathonInDB(HackathonBase):
    """Schema for hackathon stored in database"""
    id: str = Field(..., alias="_id")
    scraped_from: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"populate_by_name": True, "from_attributes": True}


class ScrapeRequest(BaseModel):
    """Request schema for scraping"""
    urls: List[str]
    force_refresh: bool = False


class ScrapeResponse(BaseModel):
    """Response schema for scrape initiation"""
    task_id: str
    status: str
    message: str
    total_urls: int


class ScrapeResult(BaseModel):
    """Result of a single URL scrape"""
    url: str
    success: bool
    hackathon: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None
