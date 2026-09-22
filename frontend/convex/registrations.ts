import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

/**
 * Personal registration tracking.
 *
 * HackkyHub never registers anyone and cannot see registrations on the
 * source platform. It only records two things the user did:
 * - `startedAt`: they clicked Apply Now and were sent to the official site.
 * - `selfReportedAt`: they told us they finished. This is self-reported.
 */

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Sign in to track registrations.");
  return userId;
}

async function findRow(ctx: QueryCtx, userId: Id<"users">, hackathonId: Id<"hackathons">) {
  return await ctx.db
    .query("registrations")
    .withIndex("by_userId_and_hackathonId", (q) => q.eq("userId", userId).eq("hackathonId", hackathonId))
    .unique();
}

/** Records that the user started registering. Keeps the first start time. */
export const start = mutation({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if ((await ctx.db.get(args.hackathonId)) === null) throw new ConvexError("Hackathon not found.");

    const existing = await findRow(ctx, userId, args.hackathonId);
    if (existing === null) {
      await ctx.db.insert("registrations", { userId, hackathonId: args.hackathonId, startedAt: Date.now() });
    }
    return null;
  },
});

/** Sets or clears the user's own "I've registered" claim. */
export const setSelfReported = mutation({
  args: { hackathonId: v.id("hackathons"), registered: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await findRow(ctx, userId, args.hackathonId);

    if (existing === null) {
      if (!args.registered) return null;
      if ((await ctx.db.get(args.hackathonId)) === null) throw new ConvexError("Hackathon not found.");
      const now = Date.now();
      await ctx.db.insert("registrations", {
        userId,
        hackathonId: args.hackathonId,
        startedAt: now,
        selfReportedAt: now,
      });
      return null;
    }

    await ctx.db.patch(existing._id, { selfReportedAt: args.registered ? Date.now() : undefined });
    return null;
  },
});

/** Removes the hackathon from the user's registration tracking entirely. */
export const remove = mutation({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await findRow(ctx, userId, args.hackathonId);
    if (existing !== null) await ctx.db.delete(existing._id);
    return null;
  },
});

/** The signed-in user's tracking state for one hackathon; null if none or signed out. */
export const getMine = query({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await findRow(ctx, userId, args.hackathonId);
    if (row === null) return null;
    return { startedAt: row.startedAt, selfReportedAt: row.selfReportedAt ?? null };
  },
});
