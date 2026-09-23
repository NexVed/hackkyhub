"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Loader2, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { HackathonCard } from "./HackathonCards";
import { EmptyNote, Panel, Skeleton } from "./primitives";

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
  emptySubtitle = "Search and filter everything in Convex",
}: {
  search: string;
  onClearSearch: () => void;
  platforms: string[];
  /** MNC-only pages keep the filter on and hide its toggle. */
  lockMnc?: boolean;
  title?: string;
  emptySubtitle?: string;
}) {
  const [phase, setPhase] = useState<Phase | undefined>(undefined);
  const [mode, setMode] = useState<Mode | undefined>(undefined);
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [mncOnly, setMncOnly] = useState(lockMnc);
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
              setPhase(undefined);
              setMode(undefined);
              setPlatform(undefined);
              setMncOnly(lockMnc);
              onClearSearch();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/55 transition-colors hover:text-white"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        ) : (
          <SlidersHorizontal className="h-4 w-4 text-white/30" />
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
        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
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
          onClick={() => setMncOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            mncOnly
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white",
          )}
        >
          <Building2 className="h-3.5 w-3.5" /> MNC only
        </button>
        )}
        {platforms.length > 0 && (
          <select
            value={platform ?? ""}
            onChange={(event) => setPlatform(event.target.value || undefined)}
            aria-label="Filter by platform"
            className="rounded-full border border-white/10 bg-[#0d0e1a] px-3 py-1.5 text-xs capitalize text-white/70 outline-none transition-colors hover:text-white focus:border-violet-400/50"
          >
            <option value="">All platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
        {loading && shown && <Loader2 className="h-4 w-4 animate-spin text-violet-300" />}
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
              ? "No company-hosted hackathons in Convex yet."
              : "No hackathons in Convex yet. Run the scraper sync to fill this in."}
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
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-violet-300/40 hover:text-white disabled:opacity-50"
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
    <div className="relative inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
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
              active ? "text-[#0b0b14]" : "text-white/55 hover:text-white",
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
