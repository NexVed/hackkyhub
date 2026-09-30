# HackkyHub security review — September 30, 2026

## Scope and status

Local source review, isolated regression tests, dependency audit, and local browser checks cover the Next.js app, authenticated frontend Convex functions, scraper API, and legacy scraper Convex functions. This is not a completed external penetration test or a guarantee that the site cannot be compromised.

Strix is connected. Its HackkyHub domain and repository searches returned no registered assets. A source-only ZIP and file manifest are prepared in `frontend/.local-tests/hackkyhub-security-source.zip` and `frontend/.local-tests/security-archive-manifest.json`, including the reviewed production templates. It excludes environment files, credentials, Git history, dependencies, generated outputs, local agent instructions and media. No source bytes were uploaded: network access failed, and automatic approval review then rejected external export without explicit payload approval. No Strix scan was started. The prepared private-source payload may be uploaded only after explicit approval.

## Fixed findings

| Finding | Change | Validation and deployment status |
| --- | --- | --- |
| Unauthenticated scraper writes and scrape jobs | FastAPI scrape, task status, update and delete routes require a server-only bearer token. Missing configuration fails closed. | Anonymous and wrong-token requests return 401; missing configuration returns 503. Verified with isolated backend tests. Requires deployment of updated backend service. |
| Unauthenticated legacy Convex CRUD and bulk deletion | Legacy create/update/remove require a service token; deletion of every event is internal. Python writers pass the token without persisting it. | Type-checked. Apply only to a separate scraper deployment; these legacy functions are not part of the current frontend deployment. Do not deploy the scraper schema over frontend auth tables. |
| Scraper requests could target internal services or arbitrary hosts | HTTPS platform allowlist, no URL credentials/custom ports, private/reserved DNS rejection, redirect checks, protected rendered requests and disabled service workers. Custom hosts require explicit operator configuration. | Tests cover loopback, cloud metadata, IPv6, spoofed domains, userinfo, ports, private DNS and blocked sends. Fixed API fetches disable redirects. Requires backend service deployment. |
| Unlimited scrape request batches | Up to 20 URLs per API request. | Oversized requests return 422. |
| Credentialed wildcard CORS | Explicit origin allowlist, no credentialed wildcard access. | Configured through `CORS_ALLOWED_ORIGINS`. Requires backend service deployment. |
| Sync payload abuse and unsafe scraped links | Frontend sync caps streaming bodies at 2 MB and batches at 1,000 records; ingestion rejects executable URLs, unsafe optional destinations and invalid prizes. | Isolated tests verify 401, 400, 413 and sanitization. Synced to frontend **development** Convex only. |
| Missing browser security headers | Clickjacking, MIME sniffing and embedding protections, referrer policy, limited device permissions; powered-by header removed. | Next.js configuration. CSP protects framing, objects and base URLs; it is not a full script-src XSS policy. Requires frontend deployment. |
| Unsafe user-supplied social links | Server validates HTTPS GitHub, LinkedIn, Reddit and X domains, rejects credentials and custom ports, strips tracking queries and fragments. | Tests verify unsafe inputs are rejected, links persist only for the caller, and clearing removes them. Synced to frontend development Convex only. |

## Authorization and dependency checks

Teams, profile details, saved hackathons and registrations derive identity from the server-side session. Tests verify that another account cannot read or modify the caller's private library/registrations or edit/delete someone else's team. Team responses omit email addresses. Upstash stores only public dashboard aggregates; its credential is server-only.

The installed frontend dependency audit reported **zero known npm vulnerabilities** at review time. This does not assess undisclosed vulnerabilities or Python dependencies. Frontend and backend regression suites use isolated data or mocks and do not alter real user accounts.

## Remaining work

- Obtain explicit approval for the sanitized source export before starting the Strix source scan. A live scan additionally needs a verified domain, reachable target, and appropriate test accounts.
- Deploy the reviewed frontend/backend changes to their intended environments. Production configuration and production behavior have not been verified.
- Keep network egress restrictions for production to address DNS rebinding beyond application checks. Rendered fallback may need explicit trusted CDN domains.
- Review Python dependencies separately, production login abuse limits, hosting TLS configuration, and a stricter script CSP compatible with the shader and Next.js runtime.

The URL restrictions follow [OWASP SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html); browser headers use [Next.js header configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).
