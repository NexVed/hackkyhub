# 🚀 HackkyHub Universal Hackathon Scraper Architecture & Implementation Prompt

> **Monorepo Context**: `HackkyHub` aggregates hackathons from major global and Indian developer platforms into a unified Next.js dashboard backed by Convex and Upstash Redis.
>
> This specification document serves as the **master engineering blueprint and AI implementation prompt** detailing all scrapers that must be built or upgraded, the exact assets required (logos, banners, prize pools, links), and redirection mechanics.

---

## 1. Executive Summary & Repo Deep-Search Findings

After performing a deep search of the frontend and scraper microservice codebases:

1. **Brand Identity & Frontend Claims**:
   - The landing page (`frontend/components/landing/IntegrationsSection.tsx`) highlights an **astronomical solar system orbit** featuring **7 primary platforms**:
     - **Inner Orbit (High Frequency/Global)**: Devfolio, MLH, HackerEarth
     - **Middle Orbit (National/Regional Giants)**: Unstop, Hack2Skill
     - **Outer Orbit (Community Circuits)**: HackCulture, Commudle
   - The public asset directory (`frontend/public/hackathons-logo/`) already hosts **8 brand logos**, including `devnovate.svg.DEVNOVATE.Woblo.svg`.
   - The FAQ and Bento sections (`frontend/components/ui/faqsection.tsx`, `frontend/components/ui/stats-bento.tsx`) publicly claim aggregation across **Devfolio, MLH, Devpost, Unstop, HackerEarth, and more**, with zero-friction direct links to official registration portals.
   - The dashboard includes a dedicated route for **MNC Hackathons** (`frontend/app/dashboard/MNC hackathons/page.tsx`), targeting enterprise-sponsored challenges (Google, Amazon, Microsoft, Flipkart, Walmart, Tata) which predominantly run on Unstop and HackerEarth.

2. **Scraper Service Deficiencies (`hackathon-scrapper`)**:
   - **Missing Scrapers**: Despite being prominent frontend features, **Devfolio**, **HackerEarth**, **Commudle**, and **HackCulture** have **NO scrapers** implemented yet.
   - **Asset & Schema Omissions**:
     - Existing scrapers (`Devpost`, `MLH`, `Unstop`, `Hack2Skill`, `Devnovate`) **drop all banner and logo images**.
     - `convex/schema.ts` and `app/models/hackathon.py` have **no fields** for `banner_url`, `logo_url`, `platform_logo`, `redirect_url`, `prize_amount`, `prize_currency`, or `is_mnc`.
     - Devpost has a scraper in python, but its brand logo is **missing** from `frontend/public/hackathons-logo/`.
     - Existing scrapers only capture plain text or raw strings without normalizing prize amounts or verifying external redirect endpoints.

---

## 2. Universal Data Model & Schema Upgrade

Before implementing the scrapers, the Convex database schema (`convex/schema.ts`) and Pydantic validation models (`app/models/hackathon.py`) must be upgraded to store all hackathon assets and redirection links:

```typescript
// ==========================================
// Convex Schema: convex/schema.ts
// ==========================================
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  hackathons: defineTable({
    // Core Identification
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    platform: v.string(), // "devfolio" | "hackerearth" | "unstop" | "mlh" | "devpost" | "hack2skill" | "devnovate" | "commudle" | "hackculture" | "custom"
    
    // Links & Redirection
    url: v.string(),               // Internal canonical or source URL
    redirect_url: v.string(),      // Direct external registration URL (with UTM tags)
    scraped_from: v.string(),      // Source listing page or API endpoint
    
    // Visual Assets
    banner_url: v.optional(v.string()),    // High-res cover/hero banner image
    logo_url: v.optional(v.string()),      // Hackathon specific logo or organizer avatar
    platform_logo: v.string(),             // Local path: e.g., "/hackathons-logo/devfolio-icon-filled-256.png"
    
    // Prize Pool
    prizes: v.optional(v.string()),        // Formatted display string: "$50,000", "₹10,00,000"
    prize_amount: v.optional(v.number()),  // Numeric parsed value for sorting/filtering
    prize_currency: v.optional(v.string()),// "USD", "INR", "EUR", "GBP"
    
    // Dates & Scheduling
    start_date: v.optional(v.string()),    // ISO 8601 string
    end_date: v.optional(v.string()),      // ISO 8601 string
    registration_deadline: v.optional(v.string()),
    status: v.string(),                    // "upcoming" | "ongoing" | "completed"
    
    // Venue & Mode
    location: v.optional(v.string()),      // "Online" or "San Francisco, CA", "Bengaluru, India"
    is_online: v.boolean(),
    
    // Categorization & Classification
    themes: v.optional(v.array(v.string())), // ["AI/ML", "Web3", "Open Innovation"]
    organizer: v.optional(v.string()),
    is_mnc: v.boolean(),                   // True if sponsored/hosted by top MNC (Google, MSFT, etc.)
    
    // Social & Engagement Proof
    registered_count: v.optional(v.number()),
    view_count: v.optional(v.number()),
    
    // Timestamps
    created_at: v.string(),
    updated_at: v.optional(v.string()),
  })
    .index("by_url", ["url"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"])
    .index("by_is_mnc", ["is_mnc"])
    .index("by_prize_amount", ["prize_amount"]),
});
```

---

## 3. Comprehensive Scraper Inventory & Provider Matrix

| # | Provider Name | Current Status | Discovery / Listing URL | Local Platform Asset | Brand Color | Scraping Strategy | Redirection URL Pattern |
|---|---|---|---|---|---|---|---|
| **01** | **Devfolio** | ❌ **Must Build** | `https://devfolio.co/hackathons` | `/hackathons-logo/devfolio-icon-filled-256.png` | `#3770FF` | REST API (`/api/hackathons`) | `https://{slug}.devfolio.co` |
| **02** | **HackerEarth** | ❌ **Must Build** | `https://www.hackerearth.com/challenges/hackathon/` | `/hackathons-logo/hackerearth.jpg` | `#2C3454` | Challenge API & HTML Cards | `https://www.hackerearth.com/challenges/hackathon/{slug}/` |
| **03** | **Unstop** | ⚠️ **Needs Upgrade** | `https://unstop.com/hackathons` | `/hackathons-logo/unstop-icon-800x800.png` | `#1C4980` | Public Search API (`search-result`) | `https://unstop.com{seo_url}` |
| **04** | **Major League Hacking (MLH)** | ⚠️ **Needs Upgrade** | `https://mlh.io/seasons/2025/events` | `/hackathons-logo/mlh-logo-color.png` | `#E73427` | DOM parsing & JSON-LD schema | Direct Event URL (`a.event-link` or `event.website`) |
| **05** | **Devpost** | ⚠️ **Needs Upgrade** | `https://devpost.com/hackathons` | *Asset missing: add `/hackathons-logo/devpost.png`* | `#003E54` | HTML Tiles + Playwright fallback | `https://{subdomain}.devpost.com` |
| **06** | **Hack2Skill** | ⚠️ **Needs Upgrade** | `https://vision.hack2skill.com/hackathons-listing` | `/hackathons-logo/hack2skill.png` | `#FF6B00` | Vision Public List API | `https://hack2skill.com/hackathons/{eventUrl}` |
| **07** | **Devnovate** | ⚠️ **Needs Upgrade** | `https://devnovate.co/events` | `/hackathons-logo/devnovate.svg.DEVNOVATE.Woblo.svg` | `#8B5CF6` | Public JSON API (`/api/v1/events`) | `https://devnovate.co/hackathon/{hackathon}` |
| **08** | **Commudle** | ❌ **Must Build** | `https://www.commudle.com/explore/hackathons` | `/hackathons-logo/commudle-logo192.png` | `#10B981` | Explore API / Next.js Hydration | `https://www.commudle.com/communities/{comm}/events/{slug}` |
| **09** | **HackCulture** | ❌ **Must Build** | `https://hackculture.com/` | `/hackathons-logo/hackculture.png` | `#A855F7` | DOM selector / Playwright | `https://hackculture.com/events/{slug}` |
| **10** | **Universal Custom** | ⚠️ **Needs Upgrade** | Any hackathon URL | `/favicon.ico` | `#6366F1` | OpenGraph/Twitter meta + JSON-LD | Source page URL directly |

---

## 4. Provider-by-Provider Deep Dive Specifications

---

### Provider 01: Devfolio (`devfolio.co`)
*Status: MUST BUILD (New Scraper)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/devfolio-icon-filled-256.png`
  - Orbit Theme Color: `#3770FF`
- **Discovery / Listing URLs**:
  - Web: `https://devfolio.co/hackathons`
  - Internal API: `https://api.devfolio.co/api/hackathons?filter=all&page=1&limit=30` (or `https://api.devfolio.co/api/search/hackathons`)
- **Scraping Strategy**:
  - Devfolio exposes a public REST/GraphQL endpoint that powers their React app. Send headers:
    ```python
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://devfolio.co/hackathons"
    }
    ```
  - Alternatively, parse Next.js hydration props (`<script id="__NEXT_DATA__">`) from `https://devfolio.co/hackathons`.
- **Target Fields & Asset Extraction**:
  - **Hackathon Name**: `item["name"]`
  - **Banner Asset**: `item["hero_image"]` or `item["banner"]` (Full CDN URL to poster)
  - **Logo Asset**: `item["avatar"]` or `item["logo"]`
  - **Prize Pool**: `item["prizes"]` or `item["total_prize_amount"]` (Format: "₹15,00,000" or "$25,000")
  - **Dates**: `item["starts_at"]`, `item["ends_at"]`, `item["reg_ends_at"]`
  - **Mode & Location**: `item["is_online"]` (True $\to$ "Online", False $\to$ `item["location"]`)
  - **Themes / Tech**: `[tag["name"] for tag in item.get("tags", [])]`
  - **Organizer**: `item["organizer"]["name"]`
- **Redirect Mechanism**:
  - Devfolio hackathons operate on custom subdomains or routes:
    - Primary format: `https://{slug}.devfolio.co?ref=hackkyhub`
    - Portal fallback: `https://devfolio.co/hackathons/{slug}?ref=hackkyhub`

---

### Provider 02: HackerEarth (`hackerearth.com`)
*Status: MUST BUILD (New Scraper)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/hackerearth.jpg`
  - Orbit Theme Color: `#2C3454`
- **Discovery / Listing URLs**:
  - Web: `https://www.hackerearth.com/challenges/hackathon/`
  - API / Feed: `https://www.hackerearth.com/chrome-extension/events/` or `https://www.hackerearth.com/challenges/api/upcoming_challenges/`
- **Scraping Strategy**:
  - Challenge listing page contains structured HTML cards with class `.challenge-card-modern` or `.upcoming-challenge-list`.
  - Also inspect `window.__INITIAL_STATE__` on the challenge listing page for raw JSON.
- **Target Fields & Asset Extraction**:
  - **Hackathon Name**: `.challenge-name` or `.challenge-list-title`
  - **Banner Asset**: `.event-image img[src]` or background-image CSS style
  - **Logo Asset**: Company/Sponsor logo inside `.company-details img`
  - **Prize Pool**: `.prize span` or `.challenge-card-modern .prize` (e.g. "$10,000", "₹5,00,000", "Interviews / Job Offers")
  - **Dates**: `.date span`, parsed from start timestamp and end timestamp
  - **Mode & Location**: Online by default unless specific venue tag is present
  - **MNC Classification**: HackerEarth hosts challenges for Amazon, IBM, Walmart, and L’Oréal. If organizer matches Fortune 500 list, set `is_mnc = True`.
- **Redirect Mechanism**:
  - Direct challenge URL: `https://www.hackerearth.com/challenges/hackathon/{slug}/?utm_source=hackkyhub`

---

### Provider 03: Unstop (`unstop.com`)
*Status: NEEDS UPGRADE (Capture Banner, Logo, Numeric Prizes & MNC Tags)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/unstop-icon-800x800.png`
  - Orbit Theme Color: `#1C4980`
- **Discovery / Listing URLs**:
  - Web: `https://unstop.com/hackathons`
  - Public JSON API: `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page={page}&per_page=18&oppstatus=open`
- **Scraping Strategy**:
  - Already connects to public API. Must upgrade `_parse_api_item(item)` to extract visual media and metrics.
- **Upgraded Asset Extraction**:
  - **Banner Asset**:
    - `item.get("banner_desktop", {}).get("image_url")`
    - Fallback: `item.get("banner_mobile", {}).get("image_url")` or `item.get("banner")`
  - **Logo Asset**:
    - `item.get("organisation", {}).get("logoUrl2")` or `item.get("organisation", {}).get("logo")`
  - **Prize Pool**:
    - Unstop provides `item.get("prizes")` or `item.get("prize")`.
    - If integer/float: parse currency symbol based on country code (Default `₹`).
    - Store `prize_amount` numeric integer and `prize_currency: "INR"`.
  - **MNC Detection**:
    - Unstop hosts major Indian MNC hackathons (Flipkart GRiD, Tata Imagination Challenge, TVS Credit E.P.I.C, Schneider Go Green).
    - If `organisation.name` contains ["Tata", "Flipkart", "Walmart", "Amazon", "Schneider", "Hero", "Airtel", "Google", "Microsoft", "L'Oreal", "Reliance"], flag `is_mnc = True`.
  - **Social Proof**:
    - `registered_count = item.get("registerCount", 0)`
    - `view_count = item.get("viewsCount", 0)`
- **Redirect Mechanism**:
  - Construct clean direct link: `https://unstop.com{seo_url}?ref=hackkyhub`

---

### Provider 04: Major League Hacking - MLH (`mlh.io`)
*Status: NEEDS UPGRADE (Capture Event Logo, External Redirect, & Real Dates)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/mlh-logo-color.png`
  - Orbit Theme Color: `#E73427`
- **Discovery / Listing URLs**:
  - Web: `https://mlh.io/seasons/2025/events` (and `https://mlh.io/seasons/2026/events`)
- **Scraping Strategy**:
  - Hybrid BeautifulSoup + JSON-LD parsing.
  - MLH cards link either to `mlh.io/events/...` or directly to external domain (`hackthenorth.com`, `calhacks.io`).
- **Upgraded Asset Extraction**:
  - **Hackathon Name**: `.event-name` or `data["name"]`
  - **Banner Asset**: `.image-wrap img[src]` or event tile image
  - **Logo Asset**: `.event-logo img[src]` (distinct MLH event insignia)
  - **Prize Pool**: Sponsor prize badges or "MLH Winner Hardware & Swag"
  - **Dates**: Parse start/end dates from `.event-date` (e.g. "Oct 18th - 20th, 2025") or JSON-LD ISO timestamps
  - **Location**: `.event-location` (e.g., "Waterloo, ON" $\to$ `location="Waterloo, ON"`, `is_online=False`; "Digital" $\to$ `is_online=True`)
- **Redirect Mechanism**:
  - Capture the actual hackathon domain: `a.event-link[href]`.
  - If it points to external site, redirect directly with `?ref=mlh&utm_source=hackkyhub`.
  - If internal MLH page, redirect to `https://mlh.io{href}?utm_source=hackkyhub`.

---

### Provider 05: Devpost (`devpost.com`)
*Status: NEEDS UPGRADE (Fix Missing Platform Logo, Extract Posters & Prize Sums)*

- **Branding Assets**:
  - Platform Icon: Missing! **Must download/create** `frontend/public/hackathons-logo/devpost.png` (Hex: `#003E54`).
  - Add entry into `AboutSection.tsx` and `IntegrationsSection.tsx`.
- **Discovery / Listing URLs**:
  - Web: `https://devpost.com/hackathons` (Supports filters: `?challenge_type[]=online&status[]=open`)
- **Scraping Strategy**:
  - BeautifulSoup on listing tiles: `.hackathon-tile` or `a[data-role="featured_challenge"]`.
  - For single hackathons, fetch detail page for full sponsor prize table.
- **Upgraded Asset Extraction**:
  - **Banner Asset**:
    - In tile: `.hackathon-thumbnail img[src]`
    - In detail: `.featured-image img` or `#challenge-header` background
  - **Logo Asset**: Host organizer logo from `.organizer-logo` or avatar image
  - **Prize Pool**:
    - Tile prize text: `.prize-amount` (e.g. "$75,000 in prizes")
    - Parse numeric: regex `r'\$([\d,]+)'` $\to$ integer value `75000`, currency `"USD"`
  - **Themes**: `.theme-label` pills (e.g., "AI", "Fintech", "Social Good")
  - **MNC Classification**: If organizer is "Google", "AWS", "Microsoft", "Intel", flag `is_mnc = True`.
- **Redirect Mechanism**:
  - Devpost hackathons reside on subdomains: `https://{subdomain}.devpost.com/?ref_feature=challenge&ref_medium=hackkyhub`

---

### Provider 06: Hack2Skill (`hack2skill.com`)
*Status: NEEDS UPGRADE (Extract High-Res Banners & Correct Prize Formatting)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/hack2skill.png`
  - Orbit Theme Color: `#FF6B00`
- **Discovery / Listing URLs**:
  - Web: `https://vision.hack2skill.com/hackathons-listing`
  - Public JSON API: `https://vision.hack2skill.com/api/v1/innovator/public/event/public-list`
- **Scraping Strategy**:
  - Public POST/GET JSON endpoint with pagination (`page`, `records`).
- **Upgraded Asset Extraction**:
  - **Banner Asset**: `item.get("bannerImage")` or `item.get("mobileBanner")` (S3/CloudFront URL)
  - **Logo Asset**: `item.get("iconImage")`
  - **Prize Pool**: `item.get("rewards")` or `item.get("prize")` or `item.get("ticket")`
  - **Dates**: `registrationStart`, `registrationEnd`, `eventStart`, `eventEnd` (ISO strings)
  - **Themes**: `item.get("categories", [])` or `item.get("themes", [])`
- **Redirect Mechanism**:
  - `https://hack2skill.com/hackathons/{eventUrl}?utm_source=hackkyhub`

---

### Provider 07: Devnovate (`devnovate.co`)
*Status: NEEDS UPGRADE (Add Brand Logo to Orbits & Extract Poster Art)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/devnovate.svg.DEVNOVATE.Woblo.svg`
  - Orbit Theme Color: `#8B5CF6`
  - *Action*: Add Devnovate to `hackathonOrbits` in `IntegrationsSection.tsx` alongside other partners.
- **Discovery / Listing URLs**:
  - Web: `https://devnovate.co/events`
  - Public JSON API: `https://devnovate.co/api/v1/events`
- **Scraping Strategy**:
  - Public GET API returning a flat list of events.
- **Upgraded Asset Extraction**:
  - **Banner Asset**: `item.get("banner")` or `item.get("coverImage")`
  - **Logo Asset**: `item.get("logo")` or `item.get("organizationLogo")`
  - **Prize Pool**: `item.get("prizePool")` (e.g. "₹1,00,000")
  - **Dates**: Devnovate uses `DD-MM-YYYY` format for `startDate`/`endDate`, convert to ISO 8601.
- **Redirect Mechanism**:
  - `https://devnovate.co/hackathon/{hackathon_slug}?utm_source=hackkyhub`

---

### Provider 08: Commudle (`commudle.com`)
*Status: MUST BUILD (New Scraper)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/commudle-logo192.png`
  - Orbit Theme Color: `#10B981`
- **Discovery / Listing URLs**:
  - Web: `https://www.commudle.com/explore/hackathons` or `https://www.commudle.com/explore/events?event_type=hackathon`
  - API: `https://api.commudle.com/api/v1/events?type=hackathon`
- **Scraping Strategy**:
  - Commudle is built with Next.js/React. Inspect network calls or extract `__NEXT_DATA__`.
  - Fallback to BeautifulSoup on `.event-card` containers.
- **Target Fields & Asset Extraction**:
  - **Hackathon Name**: Event title in card
  - **Banner Asset**: Card poster image (`img.event-banner` or S3 link)
  - **Logo Asset**: Community logo hosting the event
  - **Prize Pool**: Extracted from summary tags or prize description
  - **Dates**: Start & end datetime
  - **Location**: City/Venue or "Online"
- **Redirect Mechanism**:
  - Direct event link: `https://www.commudle.com/communities/{community}/events/{slug}?ref=hackkyhub`

---

### Provider 09: HackCulture (`hackculture.com`)
*Status: MUST BUILD (New Scraper)*

- **Branding Assets**:
  - Platform Icon: `/hackathons-logo/hackculture.png`
  - Orbit Theme Color: `#A855F7`
- **Discovery / Listing URLs**:
  - Web: `https://hackculture.com/events` or `https://hackculture.com/`
- **Scraping Strategy**:
  - Lightweight DOM parsing or Playwright headless browser for dynamically injected event lists.
- **Target Fields & Asset Extraction**:
  - **Hackathon Name**: Heading of hackathon entry
  - **Banner Asset**: Poster art URL
  - **Dates**: Registration & competition dates
  - **Prizes**: Prize pool stated in event specs
- **Redirect Mechanism**:
  - `https://hackculture.com/events/{slug}?ref=hackkyhub`

---

### Provider 10: Universal Fallback Scraper (`CustomScraper`)
*Status: NEEDS UPGRADE (Rich Meta-Tags & JSON-LD)*

- **Purpose**: Allows users to paste *any* arbitrary hackathon link and automatically ingest it.
- **Upgraded Extraction Engine**:
  1. **OpenGraph & Twitter Card Metadata**:
     - Banner: `meta[property="og:image"]` or `meta[name="twitter:image"]`
     - Title: `meta[property="og:title"]`
     - Description: `meta[property="og:description"]`
     - Canonical Link: `link[rel="canonical"]` or `meta[property="og:url"]`
  2. **Schema.org JSON-LD**:
     - Query `<script type="application/ld+json">` for `@type: "Event"` or `@type: "Hackathon"`.
     - Extract `startDate`, `endDate`, `location`, `offers`, `organizer`.
  3. **Favicon Extraction**:
     - Fallback logo: `link[rel="icon"]` or `link[rel="apple-touch-icon"]`.

---

## 5. Specialized MNC Hackathons Pipeline (`/dashboard/MNC hackathons`)

HackkyHub features a dedicated section for MNC and corporate hackathons. The scraper service must automatically classify opportunities:

### MNC Qualifier Logic:
A hackathon is flagged `is_mnc = True` if:
1. **Organizer Match**: The organizer, sponsor, or title matches known enterprise firms:
   - *Tech Giants*: Google, Microsoft, Amazon, AWS, Meta, Apple, IBM, Oracle, Intel, AMD, NVIDIA, Cisco, Adobe, Salesforce.
   - *Finance & Consulting*: Goldman Sachs, Morgan Stanley, JPMorgan Chase, Deloitte, McKinsey, PwC, EY, American Express.
   - *Indian Corporate Conglomerates*: Tata (TCS, Tata Steel, Tata Motors), Reliance, Infosys, Wipro, Flipkart, Walmart Global Tech, Schneider Electric, L&T, TVS.
2. **Flagship Enterprise Competitions**:
   - Google Solution Challenge
   - Microsoft Imagine Cup
   - Amazon HackOn
   - Flipkart GRiD
   - Tata Imagination Challenge
   - Walmart Sparkathon
   - Smart India Hackathon (SIH)

The Convex query `hackathons:getMNC` should filter directly on `.withIndex("by_is_mnc", (q) => q.eq("is_mnc", true))`.

---

## 6. Implementation Prompt for Developers / AI Subagents

```markdown
### TASK INSTRUCTION FOR DEVELOPER AGENT

You are tasked with upgrading the HackkyHub scraping engine and database schema to complete all missing scrapers and extract all visual assets (logos, banners, prize pools, direct links).

#### Step 1: Update Database Schema & Pydantic Models
1. In `hackathon-scrapper/convex/schema.ts` and `frontend/convex/schema.ts`:
   - Add fields: `banner_url`, `logo_url`, `platform_logo`, `redirect_url`, `prize_amount`, `prize_currency`, `registration_deadline`, `is_mnc`, `registered_count`, `view_count`.
   - Add indices: `by_is_mnc`, `by_prize_amount`.
2. In `hackathon-scrapper/app/models/hackathon.py`:
   - Update `HackathonPlatform` Enum with `DEVFOLIO = "devfolio"`, `HACKEREARTH = "hackerearth"`, `COMMUDLE = "commudle"`, `HACKCULTURE = "hackculture"`.
   - Update `HackathonBase` with the new fields above.

#### Step 2: Build Missing Scrapers
1. Create `hackathon-scrapper/app/scrapers/devfolio_scraper.py`:
   - Connect to Devfolio's API / Next.js data.
   - Extract `banner_url` (`hero_image`), `logo_url` (`avatar`), `prizes`, direct link `https://{slug}.devfolio.co`.
2. Create `hackathon-scrapper/app/scrapers/hackerearth_scraper.py`:
   - Scrape challenge listing cards and API.
   - Extract challenge banner, company sponsor logo, prize pool, and set `is_mnc = True` for corporate sponsors.
3. Create `hackathon-scrapper/app/scrapers/commudle_scraper.py` and `hackathon-scrapper/app/scrapers/hackculture_scraper.py`.

#### Step 3: Upgrade Existing Scrapers for Assets
1. `unstop_scraper.py`:
   - Extract `banner_desktop` or `banner_mobile` into `banner_url`.
   - Extract `organisation.logoUrl2` into `logo_url`.
   - Parse numeric prize pool and run MNC organizer detection (`is_mnc`).
2. `devpost_scraper.py`:
   - Extract hackathon thumbnail / header image into `banner_url`.
   - Extract organizer logo into `logo_url`.
   - Parse numeric prize string into `prize_amount`.
3. `mlh_scraper.py`:
   - Extract `.event-logo img` into `logo_url` and `.image-wrap img` into `banner_url`.
   - Resolve direct destination link from `a.event-link`.
4. `hack2skill_scraper.py` & `devnovate_scraper.py`:
   - Populate `banner_url` and `logo_url` from their respective API payloads.

#### Step 4: Add Missing Devpost Brand Asset & Register Platform URLs
1. Ensure `frontend/public/hackathons-logo/devpost.png` is placed.
2. Update `hackathon-scrapper/app/scrapers/__init__.py`:
   - Register all 9 platform scrapers.
   - Add default listing URLs to `PLATFORM_URLS`.
```

---
*End of master specification.*
