import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    hackathons: defineTable({
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
        .index("by_status", ["status"]),
});
