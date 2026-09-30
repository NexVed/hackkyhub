"use client";

import { motion } from "motion/react";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;

export function Panel({
  title,
  subtitle,
  action,
  children,
  delay = 0,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease }}
      className={cn(
        "relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-white/40">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-white/12 px-4 py-6 text-sm text-slate-500 dark:text-white/40">
      <Globe2 className="h-4 w-4 shrink-0 text-slate-500 dark:text-white/25" />
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-900/[0.05] dark:bg-white/[0.05]", className)} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-[62px]" />
      ))}
    </div>
  );
}

export function LiveDot({ label = "live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      {label}
    </span>
  );
}

export const PHASE_STYLES: Record<string, { label: string; className: string }> = {
  ongoing: { label: "Live", className: "border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-200" },
  upcoming: { label: "Upcoming", className: "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-200" },
  completed: { label: "Ended", className: "border-slate-200 dark:border-white/15 bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-white/50" },
  unknown: { label: "Open", className: "border-slate-200 dark:border-white/15 bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-white/60" },
};

export function PhaseBadge({ phase }: { phase: string }) {
  const style = PHASE_STYLES[phase] ?? PHASE_STYLES.unknown!;
  return (
    <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", style.className)}>
      {style.label}
    </span>
  );
}
