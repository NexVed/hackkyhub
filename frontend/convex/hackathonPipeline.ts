import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const syncHackathons = internalMutation({
  args: {
    hackathons: v.array(v.any()),
  },

  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of args.hackathons) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.name !== "string" ||
        typeof item.url !== "string" ||
        typeof item.platform !== "string"
      ) {
        skipped++;
        continue;
      }

      const existing = await ctx.db
        .query("hackathons")
        .withIndex("by_url", (q) => q.eq("url", item.url))
        .unique();

      const hackathon = {
        name: item.name,
        url: item.url,
        platform: item.platform,

        slug: typeof item.slug === "string" ? item.slug : undefined,
        description:
          typeof item.description === "string"
            ? item.description
            : undefined,

        banner_url:
          typeof item.banner_url === "string"
            ? item.banner_url
            : undefined,

        logo_url:
          typeof item.logo_url === "string"
            ? item.logo_url
            : undefined,

        platform_logo:
          typeof item.platform_logo === "string"
            ? item.platform_logo
            : undefined,

        redirect_url:
          typeof item.redirect_url === "string"
            ? item.redirect_url
            : undefined,

        prize_amount:
          typeof item.prize_amount === "number"
            ? item.prize_amount
            : undefined,

        prize_currency:
          typeof item.prize_currency === "string"
            ? item.prize_currency
            : undefined,

        registration_deadline:
          typeof item.registration_deadline === "string"
            ? item.registration_deadline
            : undefined,

        start_date:
          typeof item.start_date === "string"
            ? item.start_date
            : undefined,

        end_date:
          typeof item.end_date === "string"
            ? item.end_date
            : undefined,

        location:
          typeof item.location === "string"
            ? item.location
            : undefined,

        is_online:
          typeof item.is_online === "boolean"
            ? item.is_online
            : false,

        is_mnc:
          typeof item.is_mnc === "boolean"
            ? item.is_mnc
            : false,

        registered_count:
          typeof item.registered_count === "number"
            ? item.registered_count
            : 0,

        view_count:
          typeof item.view_count === "number"
            ? item.view_count
            : 0,

        prizes:
          typeof item.prizes === "string"
            ? item.prizes
            : undefined,

        themes: Array.isArray(item.themes)
          ? item.themes.filter(
              (theme: unknown): theme is string =>
                typeof theme === "string",
            )
          : undefined,

        organizer:
          typeof item.organizer === "string"
            ? item.organizer
            : undefined,

        status:
          typeof item.status === "string"
            ? item.status
            : "active",

        scraped_from:
          typeof item.scraped_from === "string"
            ? item.scraped_from
            : item.platform,

        created_at:
          typeof item.created_at === "string"
            ? item.created_at
            : new Date().toISOString(),

        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, hackathon);
        updated++;
      } else {
        await ctx.db.insert("hackathons", hackathon);
        inserted++;
      }
    }

    return {
      total: args.hackathons.length,
      inserted,
      updated,
      skipped,
    };
  },
});