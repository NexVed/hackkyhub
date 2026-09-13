# HackkyHub 🚀

HackkyHub is a comprehensive, full-stack application designed to aggregate, manage, and display hackathons from multiple platforms in one unified dashboard. It automatically scrapes data from major hackathon providers like Devpost, MLH, Unstop, Hack2Skill, and Devnovate, and serves it seamlessly to users.

## 📖 What this repo is doing

Developers often have to jump between multiple websites to find hackathons. HackkyHub solves this by acting as a centralized hub. The system utilizes a background scraper microservice to periodically fetch hackathon data from various platforms, normalizes this data, and stores it in a real-time database. The frontend then consumes this data to provide a sleek, fast, and interactive user dashboard where developers can discover, track, and manage hackathon events.

## ⚙️ How it Works (Architecture)

The repository is structured as a monorepo with two primary components that communicate through a shared database (Convex).

1. **Hackathon Scraper Microservice (`/hackathon-scrapper`)**
   - Built with **Python (FastAPI)**, this service is responsible for all data acquisition.
   - It runs scheduled cron jobs via **APScheduler** (running every Monday, Wednesday, and Friday) to scrape hackathons from platforms using **BeautifulSoup4** and **Playwright**.
   - It processes and validates the scraped data using **Pydantic** models.
   - It caches high-traffic endpoints using **Upstash Redis** to reduce database read overhead.
   - Pushes the normalized hackathon data to the Convex backend.

2. **Frontend Web Application (`/frontend`)**
   - Built with **Next.js 16 (App Router)** and **React 19**.
   - Connects directly to the **Convex** backend for real-time data fetching and authentication (`@convex-dev/auth`).
   - Uses **Redux Toolkit** for global state management.
   - Renders a highly responsive and animated UI utilizing **Tailwind CSS v4**, **Shadcn UI**, and **Framer Motion / OGL** for visuals.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS v4, Radix UI, Shadcn UI
- **State Management:** Redux Toolkit (`react-redux`)
- **Authentication:** Convex Auth (`@convex-dev/auth`)
- **Forms & Validation:** React Hook Form, Zod

### Backend / Microservice
- **Framework:** Python, FastAPI, Uvicorn
- **Scraping Tools:** BeautifulSoup4, Playwright, aiohttp, lxml
- **Task Scheduling:** APScheduler
- **Validation:** Pydantic

### Database & Infrastructure
- **Primary Database:** Convex (Backend-as-a-Service)
- **Caching:** Upstash Redis
- **Package Manager:** Bun (Frontend), Pip (Backend)

---

## 🚀 Process to Start the System

To run the full application locally, you will need to start both the Frontend application and the Scraper microservice.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Bun](https://bun.sh/) (Frontend package manager)
- [Python 3.9+](https://www.python.org/)
- A [Convex](https://convex.dev/) account and project
- An [Upstash Redis](https://upstash.com/) database

### 1. Database Setup (Convex)
Navigate to the frontend folder and initialize Convex to get your deployment URLs.
```bash
cd frontend
npx convex dev
```
*This will provision your Convex backend and generate the necessary `.env.local` variables (`NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`). Keep this process running if you want real-time schema syncing.*

### 2. Running the Frontend
Open a new terminal and install the frontend dependencies, then start the development server.
```bash
cd frontend
bun install

# Start the Next.js development server
bun run dev
```
The frontend will now be accessible at `http://localhost:3000`.

### 3. Running the Scraper Microservice
Open a new terminal and set up the Python environment.
```bash
cd hackathon-scrapper

# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
venv\Scripts\activate
# For macOS/Linux use: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `hackathon-scrapper` directory and add your Convex and Upstash keys:
```env
CONVEX_URL=your_convex_url_here
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

**Start the FastAPI Server:**
```bash
# Start the Uvicorn server with hot-reload
uvicorn app.main:app --reload
```
The scraper API and Swagger documentation will be available at `http://localhost:8000/docs`.

### 4. Triggering a Scrape
While the scraper has a scheduled job that runs automatically 3 days a week, you can manually trigger a scrape to populate your database by hitting the endpoint:
```bash
curl -X POST http://localhost:8000/api/v1/scrape-all
```
You can monitor the scraping progress via the endpoint `GET /api/v1/scrape/status/{task_id}`.
