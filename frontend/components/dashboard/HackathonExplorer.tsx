"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Loader2, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { HackathonCard } from "./HackathonCards";
import { EmptyNote, Panel, Skeleton } from "./primitives";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { resetExplorerFilters, setExplorerFilters, type ExplorerScope } from "@/lib/store/dashboardSlice";
import { platformLabel } from "@/lib/platforms";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Phase = "upcoming" | "ongoing" | "completed";
type Mode = "online" | "offline";

const PAGE = 12;

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function HackathonExplorer({
  search,
  onClearSearch,
  platforms,
  lockMnc = false,
  title = "Hackathon explorer",
  emptySubtitle = "Search and filter hackathons from every platform",
  scope = "overview",
}: {
  search: string;
  onClearSearch: () => void;
  platforms: string[];
  /** MNC-only pages keep the filter on and hide its toggle. */
  lockMnc?: boolean;
  title?: string;
  emptySubtitle?: string;
  scope?: ExplorerScope;
}) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.dashboard.explorers[scope]);
  const phase = filters.phase ?? undefined;
  const mode = filters.mode ?? undefined;
  const platform = filters.platform ?? undefined;
  const mncOnly = lockMnc || filters.mncOnly;
  const setPhase = (phase: Phase | undefined) => dispatch(setExplorerFilters({ scope, filters: { phase: phase ?? null } }));
  const setMode = (mode: Mode | undefined) => dispatch(setExplorerFilters({ scope, filters: { mode: mode ?? null } }));
  const setPlatform = (platform: string | undefined) => dispatch(setExplorerFilters({ scope, filters: { platform: platform ?? null } }));
  const [limit, setLimit] = useState(PAGE);

  const debouncedSearch = useDebounced(search.trim(), 250);

  // Any filter change starts from the first page again.
  const filterKey = `${debouncedSearch}|${phase}|${mode}|${platform}|${mncOnly}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (prevKey !== filterKey) {
    setPrevKey(filterKey);
    setLimit(PAGE);
  }

  const result = useQuery(api.analytics.explore, {
    search: debouncedSearch || undefined,
    phase,
    mode,
    platform,
    mncOnly: mncOnly || undefined,
    limit,
  });

  // Keep showing the previous page while a new filter loads, so the grid does
  // not collapse to skeletons on every keystroke.
  const [lastResult, setLastResult] = useState(result);
  if (result !== undefined && result !== lastResult) setLastResult(result);
  const shown = result ?? lastResult;
  const loading = result === undefined;

  const activeFilters = [phase, mode, platform, !lockMnc && mncOnly ? "mnc" : undefined, debouncedSearch].filter(
    Boolean,
  ).length;

  return (
    <Panel
      id="explore"
      title={title}
      subtitle={
        shown
          ? `${shown.total.toLocaleString()} ${lockMnc ? "corporate " : ""}match${shown.total === 1 ? "" : "es"}${shown.truncated ? " (first 6,000 records)" : ""}`
          : emptySubtitle
      }
      action={
        activeFilters > 0 ? (
          <button
            type="button"
            onClick={() => {
              dispatch(resetExplorerFilters(scope));
              onClearSearch();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs text-slate-500 dark:text-white/55 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        ) : (
          <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-white/30" />
        )
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ChipGroup
          value={phase}
          onChange={setPhase}
          options={[
            { value: undefined, label: "All" },
            { value: "upcoming", label: "Upcoming" },
            { value: "ongoing", label: "Live" },
            { value: "completed", label: "Ended" },
          ]}
          group="phase"
        />
        <span className="mx-1 hidden h-5 w-px bg-slate-900/10 dark:bg-white/10 sm:block" />
        <ChipGroup
          value={mode}
          onChange={setMode}
          options={[
            { value: undefined, label: "Any format" },
            { value: "online", label: "Online" },
            { value: "offline", label: "In person" },
          ]}
          group="mode"
        />
        {!lockMnc && (
        <button
          type="button"
          aria-pressed={mncOnly}
          onClick={() => dispatch(setExplorerFilters({ scope, filters: { mncOnly: !mncOnly } }))}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            mncOnly
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
              : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-500 dark:text-white/55 hover:text-slate-900 dark:hover:text-white",
          )}
        >
          <Building2 className="h-3.5 w-3.5" /> MNC only
        </button>
        )}
        {platforms.length > 0 && (
          <CustomSelect value={platform ?? ""} onValueChange={(value) => setPlatform(value || undefined)} ariaLabel="Filter by platform" options={[{ value: "", label: "All platforms" }, ...platforms.map(p => ({ value: p, label: platformLabel(p) }))]} className="min-w-40 rounded-full" />
        )}
        {loading && shown && <Loader2 className="h-4 w-4 animate-spin text-violet-700 dark:text-violet-300" />}
      </div>

      {shown === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-3xl" />
          ))}
        </div>
      ) : shown.items.length === 0 ? (
        <EmptyNote>
          {activeFilters > 0
            ? "No hackathons match these filters."
            : lockMnc
              ? "No company-hosted hackathons yet. Check back for new challenges."
              : "No hackathons listed yet. Check back for new challenges."}
        </EmptyNote>
      ) : (
        <>
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {shown.items.map((item, i) => (
                <HackathonCard key={item.hackathon._id} hackathon={item.hackathon} phase={item.phase} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {shown.items.length < shown.total && (
            <div className="mt-6 flex justify-center">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLimit((l) => l + PAGE)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-900/[0.04] dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-white/80 transition-colors hover:border-violet-300/40 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Show more ({(shown.total - shown.items.length).toLocaleString()} left)
              </motion.button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function ChipGroup<T extends string>({
  value,
  onChange,
  options,
  group,
}: {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: { value: T | undefined; label: string }[];
  group: string;
}) {
  return (
    <div className="relative inline-flex rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active ? "text-[#0b0b14]" : "text-slate-500 dark:text-white/55 hover:text-slate-900 dark:hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId={`chip-${group}`}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-violet-200 to-teal-100"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default HackathonExplorer;
