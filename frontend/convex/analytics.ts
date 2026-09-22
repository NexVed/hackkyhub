import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { phaseOf, toTime, type Phase } from "./lib/phase";

export type { Phase };

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

    // Start-date timeline: this month plus the next five, keyed "YYYY-MM" (UTC).
    const monthKeys: string[] = [];
    {
      const cursor = new Date(now);
      cursor.setUTCDate(1);
      for (let i = 0; i < 6; i++) {
        monthKeys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }
    const startsByMonth = new Map<string, number>(monthKeys.map((key) => [key, 0]));

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

      const start = toTime(row.start_date);
      if (start !== null) {
        const d = new Date(start);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (startsByMonth.has(key)) startsByMonth.set(key, (startsByMonth.get(key) ?? 0) + 1);
      }

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
      startsByMonth: monthKeys.map((month) => ({ month, count: startsByMonth.get(month) ?? 0 })),
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

/**
 * Largest listed prize pools that have not finished. Walks the existing
 * `by_prize_amount` index from the top instead of scanning the table.
 * Amounts are compared raw, so mixed currencies are not normalised; each
 * card shows its own currency.
 */
export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.min(12, Math.max(1, Math.floor(args.limit ?? 4)));

    const candidates = await ctx.db
      .query("hackathons")
      .withIndex("by_prize_amount")
      .order("desc")
      .take(200);

    return candidates
      .filter(
        (row) =>
          typeof row.prize_amount === "number" &&
          row.prize_amount > 0 &&
          phaseOf(row, now) !== "completed",
      )
      .slice(0, limit)
      .map((row) => ({ hackathon: row, phase: phaseOf(row, now) }));
  },
});

const PHASE_RANK: Record<Phase, number> = { ongoing: 0, upcoming: 1, unknown: 2, completed: 3 };

/**
 * Filterable explorer. Uses the `by_platform` index when a platform is chosen,
 * then applies the remaining filters in memory over a bounded slice.
 */
export const explore = query({
  args: {
    search: v.optional(v.string()),
    platform: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("online"), v.literal("offline"))),
    phase: v.optional(
      v.union(v.literal("upcoming"), v.literal("ongoing"), v.literal("completed")),
    ),
    mncOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.min(60, Math.max(1, Math.floor(args.limit ?? 12)));
    const platform = args.platform;

    const rows = platform
      ? await ctx.db
          .query("hackathons")
          .withIndex("by_platform", (q) => q.eq("platform", platform))
          .take(MAX_SCAN)
      : await ctx.db.query("hackathons").take(MAX_SCAN);

    const needle = args.search?.trim().toLowerCase() ?? "";

    const matched = rows
      .map((row) => ({ row, phase: phaseOf(row, now) }))
      .filter(({ row, phase }) => {
        if (args.mode === "online" && !row.is_online) return false;
        if (args.mode === "offline" && row.is_online) return false;
        if (args.phase && phase !== args.phase) return false;
        if (args.mncOnly && row.is_mnc !== true) return false;
        if (!needle) return true;
        const haystack = [
          row.name,
          row.organizer,
          row.platform,
          row.location,
          ...(row.themes ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const rank = PHASE_RANK[a.phase] - PHASE_RANK[b.phase];
        if (rank !== 0) return rank;
        const aStart = toTime(a.row.start_date) ?? Number.MAX_SAFE_INTEGER;
        const bStart = toTime(b.row.start_date) ?? Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
      });

    return {
      items: matched.slice(0, limit).map(({ row, phase }) => ({ hackathon: row, phase })),
      total: matched.length,
      truncated: rows.length === MAX_SCAN,
    };
  },
});
