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
        // Detail-page fields. Only set when the source platform publishes them;
        // the UI says "Not provided by source" otherwise.
        tracks: v.optional(v.array(v.string())),
        eligibility: v.optional(v.string()),
        rules: v.optional(v.string()),
    })
        .index("by_url", ["url"])
        .index("by_slug", ["slug"])
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

    // Registration tracking. `startedAt` is recorded when the user clicks
    // Apply Now and is sent to the official site. `selfReportedAt` is set only
    // when the user says they finished registering; HackkyHub cannot verify it.
    registrations: defineTable({
        userId: v.id("users"),
        hackathonId: v.id("hackathons"),
        startedAt: v.number(),
        selfReportedAt: v.optional(v.number()),
    })
        .index("by_userId_and_hackathonId", ["userId", "hackathonId"])
        .index("by_userId_and_startedAt", ["userId", "startedAt"]),

    // Details the user chose themselves. Kept apart from the auth `users`
    // table because Convex Auth overwrites users.name/image with the provider
    // profile on every Google/GitHub sign-in.
    profiles: defineTable({
        userId: v.id("users"),
        displayName: v.optional(v.string()),
        headline: v.optional(v.string()),
        location: v.optional(v.string()),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"]),

    hackathonViews: defineTable({
        userId: v.id("users"),
        hackathonId: v.id("hackathons"),
        viewedAt: v.number(),
    })
        .index("by_userId_and_hackathonId", ["userId", "hackathonId"])
        .index("by_userId_and_viewedAt", ["userId", "viewedAt"]),
});
