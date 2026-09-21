import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,
    // New fields are optional for compatibility with already stored records.
    hackathons: defineTable({
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
        created_at: v.string(),
        updated_at: v.optional(v.string()),
    })
        .index("by_url", ["url"])
        .index("by_platform", ["platform"])
        .index("by_status", ["status"])
        .index("by_platform_and_status", ["platform", "status"])
        .index("by_is_mnc", ["is_mnc"])
        .index("by_prize_amount", ["prize_amount"]),

    // Per-user library. Kept as their own tables rather than arrays on the user
    // document so they can grow without hitting the 1MB document limit.
    savedHackathons: defineTable({
        userId: v.id("users"),
        hackathonId: v.id("hackathons"),
        savedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_and_hackathonId", ["userId", "hackathonId"]),

    hackathonViews: defineTable({
        userId: v.id("users"),
        hackathonId: v.id("hackathons"),
        viewedAt: v.number(),
    })
        .index("by_userId_and_hackathonId", ["userId", "hackathonId"])
        .index("by_userId_and_viewedAt", ["userId", "viewedAt"]),
});
