"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { BadgeCheck, Bookmark, CalendarClock, CalendarDays, Eye, Flame, Mail, MapPin, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { HackathonRow } from "@/components/dashboard/HackathonCards";
import { EmptyNote, ListSkeleton, Panel, Skeleton, ease } from "@/components/dashboard/primitives";
import { NetworkField } from "@/components/visuals/NetworkField";
import { initials, relativeTime } from "@/lib/format";
import { PROFILE } from "@/lib/profile";
import { cn } from "@/lib/utils";

const WEEKS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(time: number) {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Profile page. Name, role and location are the owner's chosen display
 * fields (lib/profile.ts); every number, list and heatmap cell below them is
 * read from Convex for the signed-in account.
 */
export function ProfileOverview() {
  const viewer = useQuery(api.users.viewer, {});
  const library = useQuery(api.userLibrary.getMyLibraryStats, {});
  const saved = useQuery(api.userLibrary.listSaved, { limit: 6 });
  const recent = useQuery(api.userLibrary.listRecentlyViewed, { limit: 6 });
  const activity = useQuery(api.userLibrary.getMyActivity, { days: WEEKS * 7 });

  const name = PROFILE.displayName;

  const heatmap = useMemo(() => {
    if (!activity) return null;
    const counts = new Map<string, number>();
    for (const t of [...activity.views, ...activity.saves]) {
      const key = dayKey(t);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime() - (WEEKS * 7 - 1) * DAY_MS;
    const days = Array.from({ length: WEEKS * 7 }, (_, i) => {
      const t = start + i * DAY_MS;
      return { t, count: counts.get(dayKey(t)) ?? 0 };
    });
    const activeDays = days.filter((d) => d.count > 0).length;
    const max = Math.max(1, ...days.map((d) => d.count));
    // Current streak: consecutive active days ending today.
    let streak = 0;
    for (let i = days.length - 1; i >= 0 && days[i]!.count > 0; i--) streak++;
    return { days, activeDays, max, streak, total: activity.views.length + activity.saves.length };
  }, [activity]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07070d]">
      <div className="pointer-events-none absolute -right-32 -top-24 h-[26rem] w-[26rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -left-24 top-[36rem] h-80 w-80 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Identity card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0c18]"
        >
          <div className="relative h-40 overflow-hidden bg-[linear-gradient(120deg,#2a1560_0%,#16194a_45%,#0b3440_100%)] sm:h-48">
            <NetworkField density={1.1} linkDistance={100} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(94,234,212,0.25),transparent_50%)]" />
            <motion.div
              aria-hidden
              className="font-display pointer-events-none absolute -right-4 bottom-[-0.35em] select-none text-[120px] italic leading-none text-white/[0.06] sm:text-[170px]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease }}
            >
              {initials(name)}
            </motion.div>
          </div>

          <div className="relative px-6 pb-7 sm:px-10">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <Monogram name={name} />
              <div className="flex flex-wrap gap-2 sm:pb-2">
                {viewer?.email && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    <BadgeCheck className="h-3.5 w-3.5" /> Email verified
                  </span>
                )}
                {heatmap && heatmap.streak > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                    <Flame className="h-3.5 w-3.5" /> {heatmap.streak}-day streak
                  </span>
                )}
              </div>
            </div>

            <AnimatedName name={name} />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="mt-2 flex items-center gap-2 text-sm font-medium text-violet-200/80"
            >
              <Sparkles className="h-4 w-4" /> {PROFILE.role}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55"
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-300/80" /> {PROFILE.location}
              </span>
              {viewer?.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-sky-300/80" /> {viewer.email}
                </span>
              )}
              {viewer && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-teal-300/80" /> Joined{" "}
                  {new Date(viewer.joinedAt).toLocaleDateString("en", { month: "long", year: "numeric" })}
                </span>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ProfileStat index={0} icon={Bookmark} tone="text-violet-300" glow="bg-violet-500/20" label="Saved" value={library?.saved} />
          <ProfileStat index={1} icon={CalendarClock} tone="text-sky-300" glow="bg-sky-500/20" label="Saved upcoming" value={library?.savedUpcoming} />
          <ProfileStat index={2} icon={Eye} tone="text-emerald-300" glow="bg-emerald-500/20" label="Opened" value={library?.viewed} />
          <ProfileStat index={3} icon={Flame} tone="text-amber-300" glow="bg-amber-500/20" label={`Active days · ${WEEKS}w`} value={heatmap?.activeDays} />
        </div>

        {/* Activity heatmap */}
        <Panel
          title="Activity"
          subtitle={`Saves and latest opens over the last ${WEEKS} weeks`}
          action={
            heatmap ? (
              <span className="text-xs text-white/40">
                <span className="font-semibold text-white">{heatmap.total}</span> actions
              </span>
            ) : null
          }
        >
          {activity === undefined ? (
            <Skeleton className="h-32" />
          ) : heatmap === null ? (
            <EmptyNote>Sign in to see your activity.</EmptyNote>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-[520px] gap-1.5">
                {Array.from({ length: WEEKS }).map((_, week) => (
                  <div key={week} className="flex flex-1 flex-col gap-1.5">
                    {heatmap.days.slice(week * 7, week * 7 + 7).map((day, d) => {
                      const level = day.count === 0 ? 0 : Math.ceil((day.count / heatmap.max) * 4);
                      return (
                        <motion.div
                          key={day.t}
                          title={`${new Date(day.t).toLocaleDateString("en", { day: "numeric", month: "short" })}: ${day.count} action${day.count === 1 ? "" : "s"}`}
                          initial={{ opacity: 0, scale: 0.4 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: (week * 7 + d) * 0.004, duration: 0.3 }}
                          className={cn(
                            "aspect-square rounded-[5px] transition-transform hover:scale-125",
                            ["bg-white/[0.05]", "bg-violet-500/30", "bg-violet-500/55", "bg-violet-400/80", "bg-teal-300"][level],
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-white/35">
                Less
                {["bg-white/[0.05]", "bg-violet-500/30", "bg-violet-500/55", "bg-violet-400/80", "bg-teal-300"].map((c) => (
                  <span key={c} className={cn("h-2.5 w-2.5 rounded-[3px]", c)} />
                ))}
                More
              </div>
              {heatmap.total === 0 && (
                <p className="mt-3 text-sm text-white/40">
                  No activity yet. Save or open hackathons from the dashboard and this grid lights up.
                </p>
              )}
            </div>
          )}
        </Panel>

        {/* Library lists */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Saved hackathons" subtitle="Most recently saved first" delay={0.05}>
            {saved === undefined ? (
              <ListSkeleton />
            ) : saved.length === 0 ? (
              <EmptyNote>Nothing saved yet. Tap the bookmark on any hackathon to keep it here.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {saved.map((item, i) => (
                  <HackathonRow key={item.hackathon._id} index={i} hackathon={item.hackathon} badge={`saved ${relativeTime(item.at)}`} />
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recently opened" subtitle="Your latest views" delay={0.1}>
            {recent === undefined ? (
              <ListSkeleton />
            ) : recent.length === 0 ? (
              <EmptyNote>No history yet. Hackathons you open show up here.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((item, i) => (
                  <HackathonRow key={item.hackathon._id} index={i} hackathon={item.hackathon} badge={relativeTime(item.at)} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Name revealed letter by letter, set in Times New Roman. */
function AnimatedName({ name }: { name: string }) {
  return (
    <h1
      aria-label={name}
      className="font-display mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-[56px]"
    >
      {name.split(" ").map((word, w, words) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {word.split("").map((char, c) => (
            <motion.span
              key={c}
              className="inline-block"
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2 + (w * 6 + c) * 0.03, duration: 0.5, ease }}
            >
              {char}
            </motion.span>
          ))}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </h1>
  );
}

/** Initials inside a slowly rotating gradient ring. */
function Monogram({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
      className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32"
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#a78bfa,#5eead4,#60a5fa,#f0abfc,#a78bfa)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[4px] grid place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#27204a,#0b0c18_75%)]">
        <span className="font-display text-4xl italic text-white sm:text-5xl">{initials(name)}</span>
      </div>
      <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-[3px] border-[#0b0c18] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
    </motion.div>
  );
}

function ProfileStat({
  icon: Icon,
  tone,
  glow,
  label,
  value,
  index,
}: {
  icon: typeof Bookmark;
  tone: string;
  glow: string;
  label: string;
  value: number | undefined;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.07, duration: 0.5, ease }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5"
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl opacity-70 transition-opacity group-hover:opacity-100", glow)} />
      <Icon className={cn("relative h-5 w-5", tone)} />
      <p className="relative mt-4 text-3xl font-semibold text-white tabular-nums">
        {value === undefined ? "—" : <AnimatedCounter value={value} />}
      </p>
      <p className="relative mt-1 text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    </motion.div>
  );
}

export default ProfileOverview;
