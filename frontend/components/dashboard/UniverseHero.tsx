"use client";

import { motion } from "motion/react";
import { AlarmClock, CalendarClock, Flame } from "lucide-react";
import { NetworkField } from "@/components/visuals/NetworkField";
import { relativeTime } from "@/lib/format";
import { AnimatedCounter } from "./AnimatedCounter";
import { LiveDot, ease } from "./primitives";
import { allPlatformRows, platformLabel } from "@/lib/platforms";

type Stats = {
  total: number;
  phases: { upcoming: number; ongoing: number };
  closingSoon: number;
  platforms: { platform: string; total: number }[];
  lastSynced: number | null;
};

const PLANET_COLORS = ["#a78bfa", "#5eead4", "#60a5fa", "#f0abfc", "#fbbf24", "#34d399"];

/**
 * Hero: title plus an orbit diagram where each planet is a real source
 * platform, sized by how many hackathons it contributes.
 */
export function UniverseHero({ stats }: { stats: Stats | undefined }) {
  const platforms = stats ? allPlatformRows(stats.platforms.map(row => ({ ...row, upcoming: 0 }))) : [];
  const max = Math.max(1, ...platforms.map((p) => p.total));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease }}
      className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-[linear-gradient(135deg,#ede9fe_0%,#f8faff_45%,#e6f8f5_100%)] dark:bg-[linear-gradient(135deg,#150f2e_0%,#0b0d1f_45%,#071820_100%)]"
    >
      <NetworkField density={0.7} linkDistance={115} />
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[10%] h-72 w-72 rounded-full bg-teal-500/15 blur-[110px]" />

      <div className="relative grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_1fr] lg:p-11">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <LiveDot label="updated every minute" />
            {stats?.lastSynced && (
              <span className="text-xs text-slate-500 dark:text-white/40">synced {relativeTime(stats.lastSynced)}</span>
            )}
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[56px]">
            Your Hackathon{" "}
            <span className="font-display bg-gradient-to-r from-violet-600 via-fuchsia-500 to-teal-600 dark:from-violet-200 dark:via-fuchsia-100 dark:to-teal-200 bg-clip-text italic text-transparent">
              Universe
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-white/55">
            Discover opportunities, track deadlines and find your next challenge.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <HeroPill icon={Flame} tone="text-rose-700 dark:text-rose-300" label="live now" value={stats?.phases.ongoing} />
            <HeroPill icon={CalendarClock} tone="text-sky-700 dark:text-sky-300" label="upcoming" value={stats?.phases.upcoming} />
            <HeroPill icon={AlarmClock} tone="text-amber-700 dark:text-amber-300" label="closing this week" value={stats?.closingSoon} />
          </div>
        </div>

        {/* Orbit diagram */}
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          {[0.5, 0.72, 0.96].map((scale, ring) => (
            <div
              key={ring}
              className="absolute inset-0 m-auto rounded-full border border-dashed border-slate-200 dark:border-white/[0.09]"
              style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
            />
          ))}

          {platforms.map((p, i) => {
            const orbit = [0.72, 0.96, 0.5][i % 3]!;
            const size = p.total ? 10 + Math.sqrt(p.total / max) * 18 : 7;
            const color = PLANET_COLORS[i % PLANET_COLORS.length]!;
            const duration = 26 + i * 7;
            return (
              <motion.div
                key={p.platform}
                className="absolute inset-0 m-auto"
                style={{ width: `${orbit * 100}%`, height: `${orbit * 100}%` }}
                initial={{ rotate: i * (360 / platforms.length) }}
                animate={{ rotate: i * (360 / platforms.length) + (i % 2 ? -360 : 360) }}
                transition={{ duration, repeat: Infinity, ease: "linear" }}
              >
                <motion.div
                  className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                  initial={{ rotate: -i * (360 / platforms.length) }}
                  animate={{ rotate: -i * (360 / platforms.length) - (i % 2 ? -360 : 360) }}
                  transition={{ duration, repeat: Infinity, ease: "linear" }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 220, damping: 14 }}
                    className="block rounded-full"
                    style={{
                      width: size,
                      height: size,
                      background: `radial-gradient(circle at 30% 30%, #fff, ${color} 45%, ${color}55 100%)`,
                      boxShadow: p.total ? `0 0 ${size}px ${color}88` : "none",
                      opacity: p.total ? 1 : 0.45,
                    }}
                  />
                  <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/80 dark:bg-black/40 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-700 dark:text-white/70 backdrop-blur-sm">
                    {platformLabel(p.platform)} · {p.total}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Core */}
          <div className="absolute inset-0 m-auto grid h-[30%] w-[30%] place-items-center rounded-full border border-violet-300/30 bg-[radial-gradient(circle,#ddd6fe,#fff_70%)] dark:bg-[radial-gradient(circle,rgba(139,92,246,0.45),rgba(12,10,30,0.9)_70%)] shadow-[0_0_60px_-8px_rgba(139,92,246,0.8)]">
            <div className="text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums sm:text-3xl">
                {stats ? <AnimatedCounter value={stats.total} /> : "—"}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">tracked</p>
            </div>
          </div>

          {stats && platforms.length === 0 && (
            <p className="absolute inset-x-0 bottom-0 text-center text-xs text-slate-500 dark:text-white/40">
              Platforms appear here once the scraper syncs.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function HeroPill({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Flame;
  tone: string;
  label: string;
  value: number | undefined;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900/[0.05] dark:bg-white/[0.05] px-3.5 py-2 text-sm backdrop-blur-md">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
        {value === undefined ? "—" : <AnimatedCounter value={value} />}
      </span>
      <span className="text-slate-500 dark:text-white/45">{label}</span>
    </span>
  );
}

export default UniverseHero;
