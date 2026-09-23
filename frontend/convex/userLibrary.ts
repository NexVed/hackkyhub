import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Per-user saved hackathons and view history.
 *
 * The caller's identity is always derived server-side from the session; no
 * function here accepts a user id as an argument, so one signed-in user can
 * never read or mutate another user's library.
 */

const RECENT_VIEW_LIMIT = 50;

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  return userId;
}

/** Drops rows whose hackathon has since been removed from the table. */
async function hydrate(
  ctx: QueryCtx,
  rows: { hackathonId: Id<"hackathons">; at: number }[],
): Promise<{ hackathon: Doc<"hackathons">; at: number }[]> {
  const hydrated = await Promise.all(
    rows.map(async (row) => {
      const hackathon = await ctx.db.get(row.hackathonId);
      return hackathon === null ? null : { hackathon, at: row.at };
    }),
  );
  return hydrated.filter((item) => item !== null);
}

/** Saves or unsaves a hackathon for the signed-in user. Returns the new state. */
export const toggleSave = mutation({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const existing = await ctx.db
      .query("savedHackathons")
      .withIndex("by_userId_and_hackathonId", (q) =>
        q.eq("userId", userId).eq("hackathonId", args.hackathonId),
      )
      .unique();

    if (existing !== null) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    await ctx.db.insert("savedHackathons", {
      userId,
      hackathonId: args.hackathonId,
      savedAt: Date.now(),
    });
    return { saved: true };
  },
});

/** The signed-in user's saved hackathons, most recently saved first. */
export const listSaved = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const limit = Math.min(100, Math.max(1, Math.floor(args.limit ?? 20)));
    const rows = await ctx.db
      .query("savedHackathons")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return hydrate(
      ctx,
      rows.map((row) => ({ hackathonId: row.hackathonId, at: row.savedAt })),
    );
  },
});

/**
 * Just the ids, so list UIs can render bookmark state without loading every
 * saved document.
 */
export const listSavedIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const rows = await ctx.db
      .query("savedHackathons")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    return rows.map((row) => row.hackathonId);
  },
});

/**
 * Records that the user opened a hackathon. Re-viewing updates the existing
 * row instead of inserting a duplicate, so history stays one row per item.
 */
export const recordView = mutation({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null; // Anonymous browsing is not an error.

    const existing = await ctx.db
      .query("hackathonViews")
      .withIndex("by_userId_and_hackathonId", (q) =>
        q.eq("userId", userId).eq("hackathonId", args.hackathonId),
      )
      .unique();

    if (existing !== null) {
      await ctx.db.patch(existing._id, { viewedAt: Date.now() });
      return null;
    }

    await ctx.db.insert("hackathonViews", {
      userId,
      hackathonId: args.hackathonId,
      viewedAt: Date.now(),
    });

    // Trim the tail so history cannot grow without bound.
    const all = await ctx.db
      .query("hackathonViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    for (const stale of all.slice(RECENT_VIEW_LIMIT)) {
      await ctx.db.delete(stale._id);
    }
    return null;
  },
});

/** The signed-in user's view history, most recent first. */
export const listRecentlyViewed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 10)));
    const rows = await ctx.db
      .query("hackathonViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return hydrate(
      ctx,
      rows.map((row) => ({ hackathonId: row.hackathonId, at: row.viewedAt })),
    );
  },
});

/**
 * Headline numbers for the dashboard's personal panel. Returns `signedIn:
 * false` rather than zeros so the UI can tell "no account" from "empty library".
 */
export const getMyLibraryStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { signedIn: false as const, saved: 0, viewed: 0, savedUpcoming: 0 };
    }

    const saved = await ctx.db
      .query("savedHackathons")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    const viewed = await ctx.db
      .query("hackathonViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", userId))
      .take(500);

    const now = Date.now();
    let savedUpcoming = 0;
    for (const row of saved) {
      const hackathon = await ctx.db.get(row.hackathonId);
      if (hackathon === null) continue;
      const start = hackathon.start_date ? Date.parse(hackathon.start_date) : NaN;
      if (!Number.isNaN(start) && start > now) savedUpcoming++;
    }

    return {
      signedIn: true as const,
      saved: saved.length,
      viewed: viewed.length,
      savedUpcoming,
    };
  },
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Raw timestamps of the signed-in user's saves and most recent opens in the
 * last `days` days. Bucketing happens on the client so days follow the
 * viewer's own timezone. Views are one row per hackathon (re-opening updates
 * it), so this is "latest touch" activity rather than every page view.
 */
export const getMyActivity = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const days = Math.min(180, Math.max(7, Math.floor(args.days ?? 84)));
    const since = Date.now() - days * DAY_MS;

    const views = await ctx.db
      .query("hackathonViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", userId).gte("viewedAt", since))
      .take(500);

    const saves = await ctx.db
      .query("savedHackathons")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    return {
      since,
      days,
      views: views.map((row) => row.viewedAt),
      saves: saves.filter((row) => row.savedAt >= since).map((row) => row.savedAt),
    };
  },
});
