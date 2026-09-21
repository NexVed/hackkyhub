"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import {
  AlarmClock,
  Bookmark,
  Building2,
  CalendarClock,
  Eye,
  Flame,
  Globe2,
  LayoutGrid,
  Trophy,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { StatCard } from "./StatCard";
import { ModeDonut } from "./ModeDonut";
import { PlatformBars } from "./PlatformBars";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.round(value),
  );
}

function money(amount: number, currency: string) {
  if (currency === "UNKNOWN") return compact(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    // Some platforms report non-ISO currency labels.
    return `${compact(amount)} ${currency}`;
  }
}

function relativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function DashboardOverview() {
  const stats = useQuery(api.analytics.getDashboardStats, {});
  const closingSoon = useQuery(api.analytics.getClosingSoon, { limit: 5, days: 14 });
  const trending = useQuery(api.analytics.getTrending, { limit: 5 });

  const savedIds = useQuery(api.userLibrary.listSavedIds, {});
  const library = useQuery(api.userLibrary.getMyLibraryStats, {});
  const recentlyViewed = useQuery(api.userLibrary.listRecentlyViewed, { limit: 5 });
  const toggleSave = useMutation(api.userLibrary.toggleSave);
  const recordView = useMutation(api.userLibrary.recordView);

  const savedSet = new Set(savedIds ?? []);
  const loading = stats === undefined;

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07070d]">
      {/* Ambient light field */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sky-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <motion.div {...fade} transition={{ duration: 0.5 }}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Hackathon intelligence
            </h1>
            <LiveDot />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-white/45">
            {loading
              ? "Reading the latest sync from Convex…"
              : stats.total === 0
                ? "No hackathons in Convex yet. Run the scraper sync and this fills in automatically."
                : `Live across ${stats.platforms.length} platform${stats.platforms.length === 1 ? "" : "s"}${
                    stats.lastSynced ? ` · last sync ${relativeTime(stats.lastSynced)}` : ""
                  }`}
          </p>
          {stats?.truncated && (
            <p className="mt-2 inline-flex rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200/90">
              Showing the first 6,000 records — totals are a lower bound.
            </p>
          )}
        </motion.div>

        {/* Stat grid */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} index={i} />)
          ) : (
            <>
              <StatCard
                index={0}
                label="Tracked"
                value={stats.total}
                icon={LayoutGrid}
                accent="violet"
                hint="total in Convex"
              />
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
                label="Live now"
                value={stats.phases.ongoing}
                icon={Flame}
                accent="rose"
                hint="currently running"
                share={stats.total ? stats.phases.ongoing / stats.total : 0}
              />
              <StatCard
                index={3}
                label="MNC"
                value={stats.mnc}
                icon={Building2}
                accent="emerald"
                hint="corporate-hosted"
                share={stats.total ? stats.mnc / stats.total : 0}
              />
              <StatCard
                index={4}
                label="Closing soon"
                value={stats.closingSoon}
                icon={AlarmClock}
                accent="amber"
                hint="deadline within 7 days"
              />
              <StatCard
                index={5}
                label="With prizes"
                value={stats.prize.withPrize}
                icon={Trophy}
                accent="violet"
                hint={
                  stats.prize.pools[0]
                    ? `top pool ${money(stats.prize.pools[0].amount, stats.prize.pools[0].currency)}`
                    : "no prize data yet"
                }
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel title="Format split" subtitle="Online vs in-person" delay={0.1}>
            {loading ? (
              <BlockSkeleton className="h-36" />
            ) : (
              <ModeDonut online={stats.mode.online} offline={stats.mode.offline} />
            )}
          </Panel>

          <Panel
            title="Platforms"
            subtitle="Volume by source"
            delay={0.16}
            className="lg:col-span-2"
          >
            {loading ? (
              <BlockSkeleton className="h-36" />
            ) : (
              <PlatformBars platforms={stats.platforms.slice(0, 6)} />
            )}
          </Panel>
        </div>

        {/* Prize pools */}
        {!loading && stats.prize.pools.length > 0 && (
          <Panel title="Prize pools" subtitle="Summed per currency" delay={0.2} className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.prize.pools.slice(0, 4).map((pool, i) => (
                <motion.div
                  key={pool.currency}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    {pool.currency === "UNKNOWN" ? "Unlabelled currency" : pool.currency}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    <AnimatedCounter
                      value={pool.amount}
                      format={(v) => money(v, pool.currency)}
                    />
                  </p>
                  <p className="mt-1 text-xs text-white/35">across {pool.count} hackathons</p>
                </motion.div>
              ))}
            </div>
          </Panel>
        )}

        {/* Personal library */}
        {library?.signedIn && (
          <Panel title="Your library" subtitle="Saved and recently opened" delay={0.22} className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <MiniStat icon={Bookmark} label="Saved" value={library.saved} accent="text-violet-300" />
                <MiniStat
                  icon={CalendarClock}
                  label="Saved upcoming"
                  value={library.savedUpcoming}
                  accent="text-sky-300"
                />
                <MiniStat icon={Eye} label="Viewed" value={library.viewed} accent="text-emerald-300" />
              </div>

              <div>
                {recentlyViewed === undefined ? (
                  <ListSkeleton />
                ) : recentlyViewed.length === 0 ? (
                  <EmptyNote>
                    Nothing opened yet. Hackathons you click from here show up in this list.
                  </EmptyNote>
                ) : (
                  <ul className="space-y-2.5">
                    {recentlyViewed.map((item, i) => (
                      <Row
                        key={item.hackathon._id}
                        index={i}
                        hackathon={item.hackathon}
                        badge={relativeTime(item.at)}
                        saved={savedSet.has(item.hackathon._id)}
                        onToggleSave={(id) => void toggleSave({ hackathonId: id })}
                        onOpen={(id) => void recordView({ hackathonId: id })}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        )}

        {/* Lists */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Closing soon" subtitle="Next 14 days" delay={0.24}>
            {closingSoon === undefined ? (
              <ListSkeleton />
            ) : closingSoon.length === 0 ? (
              <EmptyNote>No registration deadlines in the next two weeks.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {closingSoon.map((item, i) => (
                  <Row
                    key={item.hackathon._id}
                    index={i}
                    hackathon={item.hackathon}
                    badge={formatCountdown(item.hoursLeft)}
                    urgent={item.hoursLeft <= 48}
                    saved={savedSet.has(item.hackathon._id)}
                    onToggleSave={(id) => void toggleSave({ hackathonId: id })}
                    onOpen={(id) => void recordView({ hackathonId: id })}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Trending" subtitle="By registrations and views" delay={0.3}>
            {trending === undefined ? (
              <ListSkeleton />
            ) : trending.length === 0 ? (
              <EmptyNote>
                No engagement numbers yet — platforms have not reported views or registrations.
              </EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {trending.map((item, i) => (
                  <Row
                    key={item.hackathon._id}
                    index={i}
                    hackathon={item.hackathon}
                    badge={`${compact(item.momentum)} pts`}
                    saved={savedSet.has(item.hackathon._id)}
                    onToggleSave={(id) => void toggleSave({ hackathonId: id })}
                    onOpen={(id) => void recordView({ hackathonId: id })}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function formatCountdown(hoursLeft: number) {
  if (hoursLeft < 1) return "under 1h";
  if (hoursLeft < 48) return `${hoursLeft}h left`;
  return `${Math.round(hoursLeft / 24)}d left`;
}

function Row({
  hackathon,
  badge,
  urgent,
  index,
  saved,
  onToggleSave,
  onOpen,
}: {
  hackathon: Doc<"hackathons">;
  badge: string;
  urgent?: boolean;
  index: number;
  saved?: boolean;
  onToggleSave?: (id: Id<"hackathons">) => void;
  onOpen?: (id: Id<"hackathons">) => void;
}) {
  const href = hackathon.redirect_url ?? hackathon.url;
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-white/20 hover:bg-white/[0.06]"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpen?.(hackathon._id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase text-white/60">
          {hackathon.platform.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">
            {hackathon.name}
          </span>
          <span className="block truncate text-xs text-white/35">
            {hackathon.is_online ? "Online" : (hackathon.location ?? "In person")} ·{" "}
            <span className="capitalize">{hackathon.platform}</span>
          </span>
        </span>
      </a>

      <span
        className={cn(
          "shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium tabular-nums",
          urgent
            ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
            : "border-white/12 bg-white/5 text-white/60",
        )}
      >
        {badge}
      </span>

      {onToggleSave && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggleSave(hackathon._id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${hackathon.name} from saved` : `Save ${hackathon.name}`}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
            saved
              ? "border-violet-400/40 bg-violet-500/15 text-violet-300"
              : "border-white/10 bg-white/5 text-white/35 hover:text-white/80",
          )}
        >
          <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
        </motion.button>
      )}
    </motion.li>
  );
}

function Panel({
  title,
  subtitle,
  children,
  delay = 0,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>}
      </div>
      {children}
    </motion.section>
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

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      live
    </span>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-white/12 px-4 py-6 text-sm text-white/40">
      <Globe2 className="h-4 w-4 shrink-0 text-white/25" />
      {children}
    </div>
  );
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="h-[132px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
    />
  );
}

function BlockSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/[0.04]", className)} />;
}

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[60px] animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

export default DashboardOverview;
