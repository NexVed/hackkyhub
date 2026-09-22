"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Bookmark, Building2, CalendarDays, MapPin, Trophy, Wifi } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDateRange, money } from "@/lib/format";
import { hackathonPath } from "@/lib/hackathon";
import { cn } from "@/lib/utils";
import { PhaseBadge, ease } from "./primitives";
import { useLibrary } from "./useLibrary";

type Hackathon = Doc<"hackathons">;

/** Deterministic gradient per platform so cards without a banner still vary. */
export function platformGradient(platform: string) {
  const palettes = [
    "from-violet-600/60 via-indigo-600/40 to-sky-500/30",
    "from-teal-500/50 via-emerald-600/30 to-indigo-700/40",
    "from-fuchsia-600/50 via-violet-700/40 to-slate-800/40",
    "from-sky-600/50 via-blue-700/40 to-violet-800/40",
    "from-amber-500/40 via-rose-600/30 to-violet-800/40",
  ];
  let hash = 0;
  for (const ch of platform) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}

export function SaveButton({ hackathon, className }: { hackathon: Hackathon; className?: string }) {
  const { isSaved, toggleSave } = useLibrary();
  const saved = isSaved(hackathon._id);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.82 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSave(hackathon._id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${hackathon.name} from saved` : `Save ${hackathon.name}`}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border backdrop-blur-md transition-colors",
        saved
          ? "border-violet-300/50 bg-violet-500/25 text-violet-200"
          : "border-white/15 bg-black/30 text-white/60 hover:text-white",
        className,
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
    </motion.button>
  );
}

/** Compact list row used in Trending, Closing soon and the library. */
export function HackathonRow({
  hackathon,
  badge,
  urgent,
  index = 0,
}: {
  hackathon: Hackathon;
  badge: string;
  urgent?: boolean;
  index?: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4, ease }}
      className="group flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-white/20 hover:bg-white/[0.06]"
    >
      <Link href={hackathonPath(hackathon)} className="flex min-w-0 flex-1 items-center gap-3">
        {hackathon.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hackathon.logo_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase text-white/60">
            {hackathon.platform.slice(0, 2)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">
            {hackathon.name}
          </span>
          <span className="block truncate text-xs text-white/35">
            {hackathon.is_online ? "Online" : (hackathon.location ?? "In person")} ·{" "}
            <span className="capitalize">{hackathon.platform}</span>
          </span>
        </span>
      </Link>
      <span
        className={cn(
          "shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium tabular-nums",
          urgent ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : "border-white/12 bg-white/5 text-white/60",
        )}
      >
        {badge}
      </span>
      <SaveButton hackathon={hackathon} />
    </motion.li>
  );
}

/** Visual card used by Featured and the Explorer grid. */
export function HackathonCard({
  hackathon,
  phase,
  index = 0,
  size = "md",
}: {
  hackathon: Hackathon;
  phase: string;
  index?: number;
  size?: "md" | "lg";
}) {
  const dates = formatDateRange(hackathon.start_date, hackathon.end_date);
  const prize =
    typeof hackathon.prize_amount === "number" && hackathon.prize_amount > 0
      ? money(hackathon.prize_amount, hackathon.prize_currency)
      : (hackathon.prizes ?? null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.06, ease }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition-colors hover:border-violet-300/30"
    >
      <Link
        href={hackathonPath(hackathon)}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${hackathon.name}`}
      />

      <div className={cn("relative overflow-hidden", size === "lg" ? "h-40" : "h-28")}>
        {hackathon.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hackathon.banner_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", platformGradient(hackathon.platform))}>
            <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b14] via-[#0a0b14]/30 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <PhaseBadge phase={phase} />
          {hackathon.is_mnc && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              <Building2 className="h-3 w-3" /> MNC
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 z-20">
          <SaveButton hackathon={hackathon} />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
          {hackathon.organizer ?? hackathon.platform}
        </p>
        <h3 className={cn("mt-1 line-clamp-2 font-semibold text-white", size === "lg" ? "text-lg" : "text-[15px]")}>
          {hackathon.name}
        </h3>

        <div className="mt-3 space-y-1.5 text-xs text-white/50">
          {dates && (
            <p className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-white/35" /> {dates}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            {hackathon.is_online ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-sky-300/70" /> Online
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-amber-300/70" /> {hackathon.location ?? "In person"}
              </>
            )}
          </p>
        </div>

        {hackathon.themes && hackathon.themes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hackathon.themes.slice(0, 3).map((theme) => (
              <span key={theme} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/55">
                {theme}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {prize ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-amber-200">
              <Trophy className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="truncate">{prize}</span>
            </span>
          ) : (
            <span className="text-xs text-white/30">Prize not listed</span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium capitalize text-white/45 transition-colors group-hover:text-violet-200">
            {hackathon.platform}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
