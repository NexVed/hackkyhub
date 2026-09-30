import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken } from "./lib/serviceAuth";

// Create a new hackathon
export const create = mutation({
    args: {
    serviceToken: v.string(),
    slug: v.optional(v.string()),
    banner_url: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    platform_logo: v.optional(v.string()),
    redirect_url: v.optional(v.string()),
    prize_amount: v.optional(v.number()),
    prize_currency: v.optional(v.string()),
    registration_deadline: v.optional(v.string()),
    is_mnc: v.optional(v.boolean()),
    registered_count: v.optional(v.number()),
    view_count: v.optional(v.number()),
        name: v.string(),
        description: v.optional(v.string()),
        url: v.string(),
        platform: v.string(),
        start_date: v.optional(v.string()),
        end_date: v.optional(v.string()),
        location: v.optional(v.string()),
        is_online: v.boolean(),
        prizes: v.optional(v.string()),
        themes: v.optional(v.array(v.string())),
        organizer: v.optional(v.string()),
        status: v.string(),
        scraped_from: v.string(),
    },
    handler: async (ctx, args) => {
        const { serviceToken, ...data } = args;
        requireServiceToken(serviceToken);
        // Check if hackathon with this URL already exists
        const existing = await ctx.db
            .query("hackathons")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...data,
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(existing._id);
        }

        const now = new Date().toISOString();
        const id = await ctx.db.insert("hackathons", {
            ...data,
            created_at: now,
            updated_at: now,
        });
        return await ctx.db.get(id);
    },
});

// Get hackathon by Convex ID
export const getById = query({
    args: { id: v.id("hackathons") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Get hackathon by URL
export const getByUrl = query({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("hackathons")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();
    },
});

// Get all hackathons with optional pagination
export const getAll = query({
    args: {
        limit: v.optional(v.number()),
        platform: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q;

        if (args.platform && args.status) {
            q = ctx.db.query("hackathons").withIndex("by_platform_and_status", (qb) =>
                qb.eq("platform", args.platform!).eq("status", args.status!));
        } else if (args.platform) {
            q = ctx.db
                .query("hackathons")
                .withIndex("by_platform", (qb) => qb.eq("platform", args.platform!));
        } else if (args.status) {
            q = ctx.db
                .query("hackathons")
                .withIndex("by_status", (qb) => qb.eq("status", args.status!));
        } else {
            q = ctx.db.query("hackathons");
        }

        return await q.take(Math.min(10000, Math.max(1, Math.floor(args.limit ?? 100))));
    },
});

// Update a hackathon
export const update = mutation({
    args: {
        serviceToken: v.string(),
        id: v.id("hackathons"),
    slug: v.optional(v.string()),
    banner_url: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    platform_logo: v.optional(v.string()),
    redirect_url: v.optional(v.string()),
    prize_amount: v.optional(v.number()),
    prize_currency: v.optional(v.string()),
    registration_deadline: v.optional(v.string()),
    is_mnc: v.optional(v.boolean()),
    registered_count: v.optional(v.number()),
    view_count: v.optional(v.number()),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        url: v.optional(v.string()),
        platform: v.optional(v.string()),
        start_date: v.optional(v.string()),
        end_date: v.optional(v.string()),
        location: v.optional(v.string()),
        is_online: v.optional(v.boolean()),
        prizes: v.optional(v.string()),
        themes: v.optional(v.array(v.string())),
        organizer: v.optional(v.string()),
        status: v.optional(v.string()),
        scraped_from: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, serviceToken, ...updates } = args;
        requireServiceToken(serviceToken);

        const existing = await ctx.db.get(id);
        if (!existing) {
            return null;
        }

        // Filter out undefined values
        const cleanUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        cleanUpdates.updated_at = new Date().toISOString();
        await ctx.db.patch(id, cleanUpdates);
        return await ctx.db.get(id);
    },
});

// Delete a hackathon
export const remove = mutation({
    args: { id: v.id("hackathons"), serviceToken: v.string() },
    handler: async (ctx, args) => {
        requireServiceToken(args.serviceToken);
        const existing = await ctx.db.get(args.id);
        if (!existing) {
            return false;
        }
        await ctx.db.delete(args.id);
        return true;
    },
});

// Delete ALL hackathons (for clean re-scrape)
export const deleteAll = internalMutation({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("hackathons").collect();
        let count = 0;
        for (const doc of all) {
            await ctx.db.delete(doc._id);
            count++;
        }
        return { deleted: count };
    },
});

// Count hackathons (optionally by platform)
export const count = query({
    args: { platform: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let results;
        if (args.platform) {
            results = await ctx.db
                .query("hackathons")
                .withIndex("by_platform", (q) => q.eq("platform", args.platform!))
                .collect();
        } else {
            results = await ctx.db.query("hackathons").collect();
        }
        return { total: results.length };
    },
});


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
