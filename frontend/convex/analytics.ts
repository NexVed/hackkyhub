import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

/**
 * Dashboard analytics.
 *
 * These queries read the real `hackathons` table that the scraper syncs into
 * Convex. Nothing here is hardcoded: if the table is empty, every number is 0
 * and the dashboard should say so rather than show placeholder figures.
 *
 * Scale note: the aggregates below scan the table. Convex caps a single query
 * at ~16k documents, so we take a bounded slice and report `truncated` when we
 * hit the ceiling. Once the table outgrows this, these move to an incrementally
 * maintained counters table.
 */
const MAX_SCAN = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Hackathon = Doc<"hackathons">;

export type Phase = "upcoming" | "ongoing" | "completed" | "unknown";

/** Parses a scraped date string; returns null when it is missing or unusable. */
function toTime(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Real dates beat the scraped `status` string, which goes stale the moment a
 * hackathon starts. We only fall back to `status` when no date is usable.
 */
function phaseOf(hackathon: Hackathon, now: number): Phase {
  const start = toTime(hackathon.start_date);
  const end = toTime(hackathon.end_date);

  if (start !== null && end !== null) {
    if (now < start) return "upcoming";
    return now <= end ? "ongoing" : "completed";
  }
  if (start !== null) return now < start ? "upcoming" : "ongoing";
  if (end !== null) return now <= end ? "ongoing" : "completed";

  switch ((hackathon.status ?? "").trim().toLowerCase()) {
    case "upcoming":
    case "open":
      return "upcoming";
    case "ongoing":
    case "live":
    case "active":
      return "ongoing";
    case "completed":
    case "closed":
    case "ended":
    case "expired":
      return "completed";
    default:
      return "unknown";
  }
}

/** Popularity signal from whatever engagement numbers the platform exposed. */
function momentumOf(hackathon: Hackathon): number {
  return (hackathon.registered_count ?? 0) * 3 + (hackathon.view_count ?? 0);
}

async function scan(ctx: QueryCtx) {
  const rows = await ctx.db.query("hackathons").take(MAX_SCAN);
  return { rows, truncated: rows.length === MAX_SCAN };
}

/**
 * Everything the dashboard hero + stat grid needs, in one round trip.
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const { rows, truncated } = await scan(ctx);
    const now = Date.now();

    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;
    let unknownPhase = 0;
    let mnc = 0;
    let online = 0;
    let offline = 0;
    let closingSoon = 0;
    let withPrize = 0;
    let lastSynced: number | null = null;

    const prizeByCurrency = new Map<string, { amount: number; count: number }>();
    const platformCounts = new Map<string, { total: number; upcoming: number }>();

    for (const row of rows) {
      const phase = phaseOf(row, now);
      if (phase === "upcoming") upcoming++;
      else if (phase === "ongoing") ongoing++;
      else if (phase === "completed") completed++;
      else unknownPhase++;

      if (row.is_mnc === true) mnc++;
      if (row.is_online) online++;
      else offline++;

      const deadline = toTime(row.registration_deadline);
      if (deadline !== null && deadline > now && deadline - now <= 7 * DAY_MS) {
        closingSoon++;
      }

      if (typeof row.prize_amount === "number" && row.prize_amount > 0) {
        withPrize++;
        // Currency is genuinely absent on some platforms, so we keep it in its
        // own bucket instead of silently assuming USD.
        const currency = (row.prize_currency ?? "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
        const bucket = prizeByCurrency.get(currency) ?? { amount: 0, count: 0 };
        bucket.amount += row.prize_amount;
        bucket.count++;
        prizeByCurrency.set(currency, bucket);
      }

      const platform = row.platform || "unknown";
      const entry = platformCounts.get(platform) ?? { total: 0, upcoming: 0 };
      entry.total++;
      if (phase === "upcoming") entry.upcoming++;
      platformCounts.set(platform, entry);

      const touched = toTime(row.updated_at) ?? toTime(row.created_at);
      if (touched !== null && (lastSynced === null || touched > lastSynced)) {
        lastSynced = touched;
      }
    }

    const prizePools = [...prizeByCurrency.entries()]
      .map(([currency, bucket]) => ({ currency, ...bucket }))
      .sort((a, b) => b.amount - a.amount);

    const platforms = [...platformCounts.entries()]
      .map(([platform, counts]) => ({ platform, ...counts }))
      .sort((a, b) => b.total - a.total);

    return {
      total: rows.length,
      truncated,
      phases: { upcoming, ongoing, completed, unknown: unknownPhase },
      mnc,
      mode: { online, offline },
      closingSoon,
      prize: { withPrize, pools: prizePools },
      platforms,
      lastSynced,
      generatedAt: now,
    };
  },
});

/** Registration deadlines inside the next `days` window, soonest first. */
export const getClosingSoon = query({
  args: { limit: v.optional(v.number()), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { rows } = await scan(ctx);
    const now = Date.now();
    const windowMs = Math.max(1, Math.floor(args.days ?? 14)) * DAY_MS;
    const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 6)));

    return rows
      .flatMap((row) => {
        const deadline = toTime(row.registration_deadline);
        if (deadline === null || deadline <= now || deadline - now > windowMs) {
          return [];
        }
        return [{ hackathon: row, deadline, hoursLeft: Math.round((deadline - now) / 3_600_000) }];
      })
      .sort((a, b) => a.deadline - b.deadline)
      .slice(0, limit);
  },
});

/** Highest-engagement hackathons that have not finished yet. */
export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { rows } = await scan(ctx);
    const now = Date.now();
    const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 6)));

    return rows
      .flatMap((row) => {
        const phase = phaseOf(row, now);
        if (phase === "completed") return [];
        const momentum = momentumOf(row);
        if (momentum <= 0) return [];
        return [{ hackathon: row, momentum, phase }];
      })
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, limit);
  },
});

/** Hackathons that have not started yet, soonest start first. */
export const getUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { rows } = await scan(ctx);
    const now = Date.now();
    const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 6)));

    return rows
      .flatMap((row) => {
        const start = toTime(row.start_date);
        if (start === null || start <= now) return [];
        return [{ hackathon: row, start, daysUntil: Math.ceil((start - now) / DAY_MS) }];
      })
      .sort((a, b) => a.start - b.start)
      .slice(0, limit);
  },
});
