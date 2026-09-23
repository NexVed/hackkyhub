"use client";

import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year!, (month ?? 1) - 1, 1)).toLocaleDateString("en", {
    month: "short",
    timeZone: "UTC",
  });
}

/** Hackathons starting per month, this month plus the next five. */
export function StartsTimeline({ months }: { months: { month: string; count: number }[] }) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const total = months.reduce((sum, m) => sum + m.count, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-white/50">
        <span className="font-semibold text-white">
          <AnimatedCounter value={total} />
        </span>{" "}
        starting in the next six months
      </p>
      <div className="flex h-44 items-end gap-2.5 sm:gap-4">
        {months.map((m, i) => {
          const height = (m.count / max) * 100;
          return (
            <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-medium text-white/70 tabular-nums opacity-80 transition-opacity group-hover:opacity-100">
                {m.count}
              </span>
              <div className="relative w-full flex-1">
                <div className="absolute inset-0 rounded-xl bg-white/[0.04]" />
                <motion.div
                  className="absolute inset-x-0 bottom-0 rounded-xl bg-gradient-to-t from-violet-600/70 via-indigo-400/70 to-teal-300/80 shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)]"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${Math.max(height, m.count > 0 ? 6 : 0)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className={`text-[11px] ${i === 0 ? "font-semibold text-violet-200" : "text-white/40"}`}>
                {monthLabel(m.month)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StartsTimeline;
