"use client";

import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";
import { allPlatformRows, platformLabel } from "@/lib/platforms";

type PlatformRow = { platform: string; total: number; upcoming: number };

/**
 * Per-platform volume. The filled portion of each bar is the platform's share
 * of the largest platform, with the upcoming subset drawn brighter on top.
 */
export function PlatformBars({ platforms }: { platforms: PlatformRow[] }) {
  platforms = allPlatformRows(platforms);
  const max = Math.max(1, ...platforms.map((p) => p.total));

  if (platforms.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-white/40">No platforms have reported data yet.</p>;
  }

  return (
    <div className="space-y-3.5">
      {platforms.map((row, index) => (
        <div key={row.platform}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-slate-700 dark:text-white/75">{platformLabel(row.platform)}</span>
            <span className="shrink-0 text-xs text-slate-500 dark:text-white/40 tabular-nums">
              <span className="font-medium text-slate-700 dark:text-white/80">
                <AnimatedCounter value={row.total} />
              </span>
              {row.upcoming > 0 && <> · {row.upcoming} upcoming</>}
              {row.total === 0 && <> · Awaiting feed data</>}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/[0.07]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500/70 to-indigo-400/70"
              initial={{ width: 0 }}
              animate={{ width: `${(row.total / max) * 100}%` }}
              transition={{ duration: 0.9, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300"
              initial={{ width: 0 }}
              animate={{ width: `${(row.upcoming / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlatformBars;
