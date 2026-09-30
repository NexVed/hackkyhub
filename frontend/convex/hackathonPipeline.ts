import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_TRACKS = 50;
const MAX_TRACK_LENGTH = 300;
const MAX_TEXT_LENGTH = 20_000;

function httpUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : undefined;
  } catch { return undefined; }
}

/** Trimmed text within the size cap, or undefined when absent/blank. */
function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT_LENGTH) : undefined;
}

/**
 * Tracks arrive either as strings or as `{ name, description }` objects,
 * depending on the platform. Stored as display strings.
 */
function tracks(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const entry of value) {
    let label: string | undefined;
    if (typeof entry === "string") {
      label = entry;
    } else if (entry && typeof entry === "object" && typeof entry.name === "string") {
      label =
        typeof entry.description === "string" && entry.description.trim()
          ? `${entry.name.trim()}: ${entry.description.trim()}`
          : entry.name;
    }
    label = label?.trim();
    if (label) out.push(label.slice(0, MAX_TRACK_LENGTH));
    if (out.length === MAX_TRACKS) break;
  }
  return out.length > 0 ? out : undefined;
}

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
        typeof item.platform !== "string" || !item.name.trim() || item.name.length > 500 || item.platform.length > 50 || !httpUrl(item.url)
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
        description: text(item.description),

        banner_url: httpUrl(item.banner_url),

        logo_url: httpUrl(item.logo_url),

        platform_logo: httpUrl(item.platform_logo),

        redirect_url: httpUrl(item.redirect_url),

        prize_amount:
          typeof item.prize_amount === "number" && Number.isFinite(item.prize_amount) && item.prize_amount >= 0
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

        tracks: tracks(item.tracks),
        eligibility: text(item.eligibility),
        rules: text(item.rules),

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
        // Keep the date the record first appeared; only updated_at moves.
        await ctx.db.patch(existing._id, { ...hackathon, created_at: existing.created_at });
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
