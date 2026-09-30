# Hackathon ingestion

Nine provider scrapers and a custom-page fallback discover hackathons. The current frontend dashboard and directories read their own Convex deployment; use the authenticated frontend sync script to populate that deployment. The FastAPI service and its separate CRUD functions remain available for a scraper deployment configured with `backend/convex`.

## Populate the frontend dashboard

From this directory with the Python virtual environment active:

```sh
python scripts/sync_to_frontend.py
python scripts/sync_to_frontend.py --platform hackculture
python scripts/sync_to_frontend.py --dry-run --output provider-report.json
```

The script loads `.env.local` and `.env` from this directory. Configure `FRONTEND_SYNC_URL` as the frontend Convex site's `/api/hackathons/sync` endpoint and `SCRAPER_SYNC_TOKEN` to match the secret in that frontend Convex deployment. Tokens stay in ignored environment files. Data is validated, deduplicated and upserted by source URL in batches; no existing event is deleted. A dry run does not require the sync token.

All nine providers were refreshed on September 30, 2026. HackCulture's old `.com/events` URL was replaced by [its official program directory](https://hackculture.io/programs) and the site's public `api.hackculture.io/api/v1/hackathons` card feed. The response is bounded to the latest 50 cards, filters completed events, and retains real dates, logos, banners and participant counts without inventing registration deadlines.

## Run locally

1. Create a virtual environment and install `requirements.txt`.
2. Install the optional rendered-page fallback with `python -m playwright install chromium`.
3. Configure the scraper's existing Convex and Redis environment variables.
4. For the standalone FastAPI CRUD service, install the JavaScript CLI dependency from this directory with `npm ci`, then apply `backend/convex` to its own scraper deployment. Do not replace the frontend schema with the scraper schema; the frontend owns auth, teams and user libraries.
5. Run `python -m uvicorn app.main:app --reload` from this directory.
6. Start Next.js from `frontend/`; use the sync script above to feed its database.

The frontend and scraper have separate Convex function configurations. The frontend's read-only directory queries use the rows synced into its deployment.

## Endpoints

- `POST /api/v1/scrape-all`: discover and upsert events from all nine providers.
- `POST /api/v1/scrape`: scrape up to 20 trusted HTTPS URLs; body: `{"urls":["https://devpost.com/hackathons"],"force_refresh":true}`.
- `GET /api/v1/scrape/status/{task_id}`: inspect progress, saves, and provider failures.
- `GET /api/v1/hackathons?platform=devpost&status=upcoming&skip=0&limit=100`: browse the directory.
- `GET /api/v1/hackathons/mnc?limit=100`: active corporate events through the Convex `by_is_mnc` index. Add `include_completed=true` for historical rows.

## Data and refresh behavior

- Records retain banners, organizer logos, local platform logos, official destination links, registration deadlines, prize amounts/currencies, and engagement counts when supplied by a source.
- Existing records are updated by URL on repeat discovery. Their original `created_at` timestamp is retained. `updated_at` changes on refresh.
- Listing discovery and scheduled `/scrape-all` retain only `upcoming` and `ongoing` events. Completed events are logged as skipped. An explicitly supplied completed event URL can still be looked up through `/scrape`.
- `GET /api/v1/hackathons` and the frontend directories hide completed rows by default. Pass `include_completed=true` when an administrative historical view is needed.
- New database fields remain optional so existing documents can survive schema deployment. New scraper writes populate `redirect_url`, `platform_logo`, and `is_mnc`. Run discovery after deployment to enrich existing rows; older rows absent from current provider feeds need individual refreshes.
- Prize text is retained; supported monetary formats include USD, INR, EUR, GBP, comma-separated numbers, thousands, millions, lakhs, and crores. Mixed currencies, admission fees, and nonmonetary rewards do not get a combined numeric prize amount. Compare amounts within the same currency.
- Dates with offsets are normalized to UTC. Dates without a timezone are interpreted as UTC; date-only values remain calendar dates represented at midnight. Missing event dates are not filled with registration dates. MLH season URLs advance in July.
- MNC classification uses word-boundary matches against company names and named competitions in titles, organizers, and available sponsor data. This is a heuristic; manually set `is_mnc` through the update endpoint when necessary. A future scrape will recompute the classification.
- Referral parameters preserve existing queries and fragments. The canonical source URL remains separate from the tracked destination. HTTP redirects followed when fetching detail pages are reflected in metadata fallback destinations.
- Pagination is bounded, with duplicate-page detection for shared API scrapers and cursor pagination for Commudle. Listing cache keys include filters, offsets, limits, and an invalidation generation.
- A provider returning no extracted events is reported in task errors, allowing an operator to distinguish that condition from successfully stored data. This can also represent a legitimately empty listing.

## Provider verification — September 15, 2026

These are read-only checks against public responses, not a database ingestion run. Counts describe the fetched sample, not total coverage.

| Provider | Verified source and result |
| --- | --- |
| Devfolio | [Public API](https://api.devfolio.co/api/hackathons?filter=all&page=1&limit=30): 30 events; 30 banners and logos. Supports current `cover_img` and nested `hackathon_setting` fields plus Next.js hydration fallback. |
| HackerEarth | [Public event feed](https://www.hackerearth.com/chrome-extension/events/): 3 hackathons with banners; non-hackathon competitions excluded. |
| Devpost | [Public search API](https://devpost.com/api/hackathons?page=1): 9 events with banners and monetary prizes. HTML and rendered tiles remain fallbacks; single-event pages support full prize text and metadata. |
| MLH | [2027 season](https://mlh.io/seasons/2027/events): 93 events from current JSON hydration, 87 banners; external websites and full dates extracted. Legacy cards and JSON-LD remain supported. |
| Hack2Skill | [Public listing API](https://vision.hack2skill.com/api/v1/innovator/public/event/public-list?page=1&records=15): 15 events with thumbnails. Uses event or submission dates separately from registration deadlines; ticket fees are excluded from prizes. |
| Devnovate | [Public events API](https://devnovate.co/api/v1/events): 284 events; 283 banners, 280 organizer logos, 144 parsed monetary prizes. |
| Commudle | [Current public API](https://json.commudle.com/api/v2/hackathons/public/all_hackathons?when=future&limit=30): 5 events, all with banners and community logos; 3 monetary prize pools. Current official routes use `/communities/{community}/hackathons/{slug}`. |
| Unstop | The proposed search endpoint returned HTTP 403 in the direct live check. Parser behavior is covered with representative API fixtures; live availability remains unverified. |
| HackCulture | The supplied domain failed TLS verification. The HTML/rendered scraper is covered with a fixture; live extraction remains unverified. Certificate checks remain enabled. |

Representative official event destinations from Devfolio, HackerEarth, Devpost, Hack2Skill, Devnovate, and Commudle returned HTTP 200. This does not verify every event, image, or subsequent registration step. Providers may omit prizes or logos; these fields remain absent rather than fabricated. Rendered fallbacks require an installed Playwright Chromium browser.

The Devpost PNG was rasterized from the official Devpost mobile SVG referenced by its public site, using the existing frontend Sharp dependency.

## Validation

All scrape, task-status, update and delete routes require `Authorization: Bearer <SCRAPER_API_TOKEN>`. An existing `SCRAPER_SYNC_TOKEN` is accepted as the fallback service credential. Missing credentials fail closed. Public hackathon reads remain available. Direct legacy Convex create/update/remove functions also require that server-only token; bulk deletion is internal. These legacy function changes must be applied only to a separate scraper deployment, never over the frontend's schema.

Scrape destinations default to the nine registered platform domains. Custom pages require an operator-configured `SCRAPER_ALLOWED_HOSTS` entry. Requests and redirects reject private/reserved DNS addresses; rendered fallback requests enforce the same trusted-host rules and block service workers. Some external CDN scripts may therefore need an explicitly trusted hostname before rendered fallback works. Fixed provider APIs do not follow redirects. Keep network egress restrictions in place for production as additional protection against DNS rebinding. `CORS_ALLOWED_ORIGINS` sets a comma-separated origin allowlist; wildcard credentialed CORS was removed.

The September 30 update synced the frontend development deployment. No production deployment or production database change was made.

From this directory:

```sh
python -m unittest discover -s tests -v
```

The suite covers provider mappings, timezone conversions, prize units, company boundaries, URL handling, JSON-LD graphs, current and legacy MLH data, Commudle cursors, malformed/empty feeds, detail selection, database serialization, and cache invalidation. Tests use fixtures and mocks and do not access live databases or Redis.

Frontend validation: `npm run build`, TypeScript, and ESLint on changed components. The scraper Convex TypeScript was checked using the frontend's installed Convex/TypeScript packages. Development synchronization is described above; no production deployment or production database writes were performed.

## Production deployment and optional operations

Use the [production guide](../docs/PRODUCTION_SETUP.md) for the scheduled Docker/
Kubernetes ingestion job, secret management, Sentry, optional Kafka, and recovery.
`requirements-ops.txt` adds optional operational dependencies. Generate a reviewed
Python 3.12 lock file before production. The Kafka consumer runs with
`python scripts/kafka_to_frontend.py`; the producer uses
`python scripts/sync_to_frontend.py --transport kafka`. The default remains HTTP.
