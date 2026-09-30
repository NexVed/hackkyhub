"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

export type Accent = "violet" | "emerald" | "amber" | "sky" | "rose";

const ACCENTS: Record<Accent, { glow: string; ring: string; text: string; bar: string }> = {
  violet: {
    glow: "bg-violet-500/20",
    ring: "border-violet-400/25",
    text: "text-violet-700 dark:text-violet-300",
    bar: "from-violet-400 to-indigo-400",
  },
  emerald: {
    glow: "bg-emerald-500/20",
    ring: "border-emerald-400/25",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-400 to-teal-300",
  },
  amber: {
    glow: "bg-amber-500/20",
    ring: "border-amber-400/25",
    text: "text-amber-700 dark:text-amber-300",
    bar: "from-amber-400 to-orange-300",
  },
  sky: {
    glow: "bg-sky-500/20",
    ring: "border-sky-400/25",
    text: "text-sky-700 dark:text-sky-300",
    bar: "from-sky-400 to-cyan-300",
  },
  rose: {
    glow: "bg-rose-500/20",
    ring: "border-rose-400/25",
    text: "text-rose-700 dark:text-rose-300",
    bar: "from-rose-400 to-pink-300",
  },
};

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: Accent;
  /** Small line under the number, e.g. "of 1,204 tracked". */
  hint?: string;
  /** 0-1. Draws a progress rail when the stat is a share of a whole. */
  share?: number;
  format?: (value: number) => string;
  index?: number;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "violet",
  hint,
  share,
  format,
  index = 0,
}: StatCardProps) {
  const tone = ACCENTS[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.035] p-5 backdrop-blur-xl transition-colors hover:border-slate-200 dark:hover:border-white/20"
    >
      {/* Accent bloom, strongest on hover */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-500",
          tone.glow,
          "opacity-60 group-hover:opacity-100",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
          {label}
        </p>
        <span className={cn("rounded-xl border bg-slate-900/5 dark:bg-white/5 p-2", tone.ring)}>
          <Icon className={cn("h-4 w-4", tone.text)} />
        </span>
      </div>

      <p className="relative mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums sm:text-4xl">
        <AnimatedCounter value={value} format={format} />
      </p>

      {hint && <p className="relative mt-1.5 text-xs text-slate-500 dark:text-white/40">{hint}</p>}

      {typeof share === "number" && (
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", tone.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, share * 100))}%` }}
            transition={{ duration: 0.9, delay: 0.2 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
