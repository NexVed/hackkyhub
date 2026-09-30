"use client";

import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Online vs in-person split. Renders as two arcs of one ring so the
 * proportion is readable without a legend lookup.
 */
export function ModeDonut({ online, offline }: { online: number; offline: number }) {
  const total = online + offline;
  const onlineShare = total > 0 ? online / total : 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth="13"
          />
          {total > 0 && (
            <>
              {/* In-person arc sits underneath, filling the remainder */}
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="rgb(251 191 36)"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={0}
                opacity={0.85}
              />
              <motion.circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="rgb(56 189 248)"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - onlineShare) }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            <AnimatedCounter
              value={onlineShare * 100}
              format={(v) => `${Math.round(v)}%`}
            />
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/40">online</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <LegendRow color="bg-sky-400" label="Online" value={online} total={total} />
        <LegendRow color="bg-amber-400" label="In person" value={offline} total={total} />
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] px-3 py-2.5">
      <span className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-white/70">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
        <AnimatedCounter value={value} />
        <span className="ml-1.5 text-xs text-slate-500 dark:text-white/35">{pct}%</span>
      </span>
    </div>
  );
}

export default ModeDonut;
