import { ConvexError } from "convex/values";
declare const process: { env: { SCRAPER_API_TOKEN?: string; SCRAPER_SYNC_TOKEN?: string } };

/** Direct database writers need the same server-only service credential. */
export function requireServiceToken(token: string) {
  const expected = process.env.SCRAPER_API_TOKEN || process.env.SCRAPER_SYNC_TOKEN;
  if (!expected || token !== expected) throw new ConvexError("Unauthorized");
}
