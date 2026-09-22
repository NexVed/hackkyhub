"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { Bookmark, Building2, CalendarClock, Eye, LayoutGrid, Trophy, Wifi } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { compact, formatCountdown, money, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";
import { DashboardHeader } from "./DashboardHeader";
import { HackathonCard, HackathonRow } from "./HackathonCards";
import { HackathonExplorer } from "./HackathonExplorer";
import { ModeDonut } from "./ModeDonut";
import { PlatformBars } from "./PlatformBars";
import { StartsTimeline } from "./StartsTimeline";
import { StatCard } from "./StatCard";
import { UniverseHero } from "./UniverseHero";
import { EmptyNote, ListSkeleton, Panel, Skeleton } from "./primitives";

/**
 * The HackkyHub dashboard. Every number and list here is read live from
 * Convex; an empty table renders explicit empty states, never placeholders.
 */
export function DashboardOverview() {
  const stats = useQuery(api.analytics.getDashboardStats, {});
  const featured = useQuery(api.analytics.getFeatured, { limit: 4 });
  const closingSoon = useQuery(api.analytics.getClosingSoon, { limit: 5, days: 14 });
  const trending = useQuery(api.analytics.getTrending, { limit: 5 });
  const library = useQuery(api.userLibrary.getMyLibraryStats, {});
  const recentlyViewed = useQuery(api.userLibrary.listRecentlyViewed, { limit: 5 });

  const [search, setSearch] = useState("");
  const loading = stats === undefined;
  const topPool = stats?.prize.pools[0];

  const scrollToExplore = () =>
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-full overflow-hidden bg-[#07070d]"
    >
      {/* Ambient light field */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -right-24 top-[40rem] h-96 w-96 rounded-full bg-sky-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader
          search={search}
          onSearch={(value) => {
            setSearch(value);
            if (value.trim()) scrollToExplore();
          }}
          onSubmitSearch={scrollToExplore}
        />

        <UniverseHero stats={stats} />

        {stats?.truncated && (
          <p className="inline-flex rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200/90">
            Showing the first 6,000 records. Totals are a lower bound.
          </p>
        )}

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[138px]" />)
          ) : (
            <>
              <StatCard index={0} label="Total" value={stats.total} icon={LayoutGrid} accent="violet" hint="hackathons tracked" />
              <StatCard
                index={1}
                label="Upcoming"
                value={stats.phases.upcoming}
                icon={CalendarClock}
                accent="sky"
                hint="not started yet"
                share={stats.total ? stats.phases.upcoming / stats.total : 0}
              />
              <StatCard
                index={2}
                label="MNC"
                value={stats.mnc}
                icon={Building2}
                accent="emerald"
                hint="company-hosted"
                share={stats.total ? stats.mnc / stats.total : 0}
              />
              <StatCard
                index={3}
                label="Online"
                value={stats.mode.online}
                icon={Wifi}
                accent="rose"
                hint={`${compact(stats.mode.offline)} in person`}
                share={stats.total ? stats.mode.online / stats.total : 0}
              />
              <StatCard
                index={4}
                label={topPool ? `Prize pool · ${topPool.currency === "UNKNOWN" ? "unlabelled" : topPool.currency}` : "Prize pool"}
                value={topPool?.amount ?? 0}
                format={(v) => (topPool ? money(v, topPool.currency) : "0")}
                icon={Trophy}
                accent="amber"
                hint={
                  topPool
                    ? `${topPool.count} hackathons${stats.prize.pools.length > 1 ? ` · +${stats.prize.pools.length - 1} currencies` : ""}`
                    : "no prize data yet"
                }
              />
            </>
          )}
        </div>

        {/* Featured */}
        <Panel title="Featured" subtitle="Largest listed prize pools still open" delay={0.05}>
          {featured === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[320px] rounded-3xl" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <EmptyNote>No open hackathons with a listed prize yet.</EmptyNote>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((item, i) => (
                <HackathonCard key={item.hackathon._id} hackathon={item.hackathon} phase={item.phase} index={i} size="lg" />
              ))}
            </div>
          )}
        </Panel>

        {/* Trending + closing soon */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Trending" subtitle="By registrations and views" delay={0.05}>
            {trending === undefined ? (
              <ListSkeleton />
            ) : trending.length === 0 ? (
              <EmptyNote>No engagement numbers yet. Platforms have not reported views or registrations.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {trending.map((item, i) => (
                  <HackathonRow key={item.hackathon._id} index={i} hackathon={item.hackathon} badge={`${compact(item.momentum)} pts`} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Closing soon" subtitle="Registration deadlines in the next 14 days" delay={0.1}>
            {closingSoon === undefined ? (
              <ListSkeleton />
            ) : closingSoon.length === 0 ? (
              <EmptyNote>No registration deadlines in the next two weeks.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {closingSoon.map((item, i) => (
                  <HackathonRow
                    key={item.hackathon._id}
                    index={i}
                    hackathon={item.hackathon}
                    badge={formatCountdown(item.hoursLeft)}
                    urgent={item.hoursLeft <= 48}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Analytics */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Starting soon" subtitle="Hackathons by start month" delay={0.05} className="lg:col-span-2">
            {loading ? <Skeleton className="h-52" /> : <StartsTimeline months={stats.startsByMonth} />}
          </Panel>
          <Panel title="Format split" subtitle="Online vs in person" delay={0.1}>
            {loading ? <Skeleton className="h-40" /> : <ModeDonut online={stats.mode.online} offline={stats.mode.offline} />}
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Platforms" subtitle="Volume by source · brighter = upcoming" delay={0.05} className="lg:col-span-2">
            {loading ? <Skeleton className="h-52" /> : <PlatformBars platforms={stats.platforms.slice(0, 7)} />}
          </Panel>
          <Panel title="Prize pools" subtitle="Summed per currency, never converted" delay={0.1}>
            {loading ? (
              <Skeleton className="h-52" />
            ) : stats.prize.pools.length === 0 ? (
              <EmptyNote>No prize amounts reported yet.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {stats.prize.pools.slice(0, 4).map((pool, i) => (
                  <motion.li
                    key={pool.currency}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-gradient-to-r from-amber-400/[0.07] to-transparent px-4 py-3"
                  >
                    <span>
                      <span className="block text-[11px] uppercase tracking-[0.14em] text-white/40">
                        {pool.currency === "UNKNOWN" ? "Unlabelled" : pool.currency}
                      </span>
                      <span className="text-xs text-white/35">{pool.count} hackathons</span>
                    </span>
                    <span className="text-xl font-semibold text-white tabular-nums">
                      <AnimatedCounter value={pool.amount} format={(v) => money(v, pool.currency)} />
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Personal library */}
        {library?.signedIn && (
          <Panel title="Your library" subtitle="Saved and recently opened" delay={0.05}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <MiniStat icon={Bookmark} label="Saved" value={library.saved} accent="text-violet-300" />
                <MiniStat icon={CalendarClock} label="Saved upcoming" value={library.savedUpcoming} accent="text-sky-300" />
                <MiniStat icon={Eye} label="Opened" value={library.viewed} accent="text-emerald-300" />
              </div>
              <div>
                {recentlyViewed === undefined ? (
                  <ListSkeleton />
                ) : recentlyViewed.length === 0 ? (
                  <EmptyNote>Nothing opened yet. Hackathons you open from the dashboard show up here.</EmptyNote>
                ) : (
                  <ul className="space-y-2.5">
                    {recentlyViewed.map((item, i) => (
                      <HackathonRow key={item.hackathon._id} index={i} hackathon={item.hackathon} badge={relativeTime(item.at)} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        )}

        <HackathonExplorer
          search={search}
          onClearSearch={() => setSearch("")}
          platforms={stats?.platforms.map((p) => p.platform) ?? []}
        />
      </div>
    </motion.div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <Icon className={cn("h-4 w-4", accent)} />
      <p className="mt-2.5 text-xl font-semibold text-white tabular-nums">
        <AnimatedCounter value={value} />
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-white/35">{label}</p>
    </div>
  );
}

export default DashboardOverview;
