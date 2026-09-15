import { query } from "./_generated/server";
import { v } from "convex/values";
// Uses the corporate flag index, never a full table scan.
export const getMNC = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db.query("hackathons")
            .withIndex("by_is_mnc", (q) => q.eq("is_mnc", true))
            .order("desc")
            .take(Math.min(1000, Math.max(1, Math.floor(args.limit ?? 100))));
    },
});
