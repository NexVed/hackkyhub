"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { HackathonExplorer } from "@/components/dashboard/HackathonExplorer";
import { LiveDot, ease } from "@/components/dashboard/primitives";
import { relativeTime } from "@/lib/format";

/**
 * Find and MNC directories. Both read the same Convex tables as the
 * dashboard, so there is one hackathon source and no scraper HTTP service
 * in the request path.
 */
export function DirectoryPage({
  title,
  subtitle,
  mncOnly = false,
}: {
  title: string;
  subtitle: string;
  mncOnly?: boolean;
}) {
  const stats = useQuery(api.analytics.getDashboardStats, {});
  const [search, setSearch] = useState("");

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07070d]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -right-24 top-[32rem] h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <LiveDot label="live data" />
              {stats?.lastSynced && (
                <span className="text-xs text-white/40">synced {relativeTime(stats.lastSynced)}</span>
              )}
            </div>
            <h1 className="font-display mt-2 text-3xl italic text-white sm:text-4xl">{title}</h1>
            <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, theme or organizer"
              aria-label="Search hackathons"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm text-white outline-none backdrop-blur-xl transition-all placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.header>

        <HackathonExplorer
          search={search}
          onClearSearch={() => setSearch("")}
          platforms={stats?.platforms.map((p) => p.platform) ?? []}
          lockMnc={mncOnly}
          title={mncOnly ? "Corporate hackathons" : "All hackathons"}
          emptySubtitle={mncOnly ? "Company-hosted events from every source" : "Everything synced into Convex"}
        />
      </div>
    </div>
  );
}

export default DirectoryPage;
