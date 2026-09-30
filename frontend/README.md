# HackkyHub frontend

HackkyHub uses Next.js, Convex, Redux Toolkit, and an optional Upstash Redis cache.

## Run locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and use the project's Convex URLs. Dashboard pages require sign-in. To sync backend functions and the Teams schema to your development deployment:

```sh
npx convex dev --once
```

## Dashboard pages

- **Home**: personal saved challenges, registrations, deadlines, featured events, and recent views.
- **Find hackathons**: searchable directory with phase, format, and platform filters.
- **MNC hackathons**: corporate directory at `/dashboard/mnc-hackathons`; old space-containing URLs redirect here.
- **Teams**: create, edit, join by invitation code, view members, link a saved hackathon, leave, or delete an owned team. Teams support up to 10 members; an account can belong to up to 20 teams.
- **Dashboard**: cross-platform statistics and hackathon discovery.
- **Profile / Settings**: a compact full-year activity heatmap, personal library, and editable account details. The graph uses fixed 10px cells in the site's violet-to-teal palette, with all months visible on desktop and internal scrolling on mobile.

The sidebar, mobile header, authentication screens, detail pages, and error page all reuse the landing page's HH liquid-metal logo. Reduced-motion preferences pause the shader animation.

Dark remains the default. The Light toggle updates every dashboard page and remembers the choice across reloads. The mobile header opens an animated drawer with keyboard focus trapping, Escape dismissal, and all seven destinations. Desktop navigation can collapse; dashboard scrollbars use the violet/teal palette. The landing character uses a smaller contained canvas on phones so its full silhouette stays clear of the title and buttons.

The supplied Hack Vishva logo powers a 1.8-second welcome animation on sign-in (300ms with reduced motion), once per browser session. Signing out resets it. An animated “Created by Hack Vishva” credit appears in the sidebar and landing page.

The landing page has its own Hack Vishva intro, which waits for fonts and decoded hero frames before fading into the page. An eight-second fallback keeps failed assets from trapping visitors. The hero retains a rolling buffer of 12 frames on phones or 24 on desktop, pauses playback while hidden or offscreen, and holds the current frame on a slow connection.

All selection lists use the same themed Radix dropdown with keyboard navigation, typeahead, scroll controls and selection indicators. Unknown URLs show an animated, responsive 404 page with home, dashboard and back navigation.

Settings supports optional GitHub, LinkedIn, Reddit and X profile links. HTTPS platform domains are checked on the server, query tracking is removed, and blank fields remove saved links. Profile links open safely in a new tab.

## Platform ingestion

The dashboard reads its frontend Convex deployment. The Platforms panel, orbit diagram and directory filters show all nine registered integrations, including sources that have no synced rows yet. Missing records are labelled as awaiting feed data.

Run `backend/scripts/sync_to_frontend.py` from the backend virtual environment to refresh all feeds. It loads the backend's ignored environment files; `FRONTEND_SYNC_URL` must point to this deployment's `/api/hackathons/sync` endpoint and `SCRAPER_SYNC_TOKEN` must match its Convex environment variable. Use `--dry-run` for discovery without writes, `--platform hackculture` to refresh one source, or `--output report.json` to retain a provider report. The development endpoint was configured and all nine feeds synced during this update. HackCulture uses its current `hackculture.io/programs` directory and public card API.

## State management

Redux Toolkit owns shared exploration searches and filters, team selection, sidebar state, and theme choices. Each directory has its own filter scope, and navigating between pages preserves those choices. Signing out clears shared dashboard state.

RTK Query manages the dashboard statistics request, deduplicates requests across pages, and refreshes every minute while the window is focused. Account details, teams, bookmarks, and registrations continue to use authenticated Convex subscriptions for immediate updates. Form drafts and open popovers remain local to their components.

## Upstash Redis

Add these **server-only** variables to `.env.local` and your hosting environment:

```dotenv
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

Restart the Next.js server after adding them. Never prefix the token with `NEXT_PUBLIC_`.

`GET /api/dashboard/stats` caches public Convex aggregates for 60 seconds. Keys include a hash of the Convex deployment URL so different deployments do not share results. Personal account data and invitation codes are never written to Redis. Responses include an `X-HackkyHub-Cache` header (`HIT`, `MISS`, or `BYPASS`). Missing credentials or Redis failures fall back to fresh Convex reads. Without credentials, the platform works with caching bypassed.

See the [Upstash TypeScript SDK documentation](https://upstash.com/docs/redis/sdks/ts/getstarted) and [RTK Query documentation](https://redux-toolkit.js.org/rtk-query/overview).

## Verify changes

```sh
npm test
npx tsc --noEmit
npm run build
npm run lint
```

Tests cover team authorization, private membership data, duplicate joins, leaving and deletion, capacity limits, Redux scope isolation, sign-out resets, and Redis failures. Tests use an isolated Convex database and mocked Redis; they do not modify live accounts.

## Production setup

See [the full production guide](../docs/PRODUCTION_SETUP.md), also available as
[a Word document](../docs/PRODUCTION_SETUP.docx). It covers Docker, AWS Terraform,
Kubernetes, protected CI/CD, Sentry, optional Kafka, monitoring and recovery.
Local validation and live-environment limitations are recorded in
[validation results](../docs/VALIDATION.md).
