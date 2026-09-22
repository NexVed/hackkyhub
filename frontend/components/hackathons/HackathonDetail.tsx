"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import {
  AlarmClock,
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Layers,
  LogIn,
  MapPin,
  ScrollText,
  Sparkles,
  Tag,
  Trophy,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { phaseOf, toTime } from "@/convex/lib/phase";
import { PhaseBadge, Skeleton, ease } from "@/components/dashboard/primitives";
import { SaveButton, platformGradient } from "@/components/dashboard/HackathonCards";
import { NetworkField } from "@/components/visuals/NetworkField";
import { ApplyPanel } from "./ApplyPanel";
import { BrandMark } from "@/components/visuals/BrandMark";
import { formatDateRange, money, relativeTime } from "@/lib/format";
import { officialUrl, plainText, safeHttpUrl } from "@/lib/hackathon";
import { cn } from "@/lib/utils";

type Hackathon = Doc<"hackathons">;

const MISSING = "Not provided by source";
const MINUTE = 60 * 1000;

/** Current time, refreshed every minute, for countdowns and phase. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), MINUTE);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatDay(time: number) {
  return new Date(time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function timeLeft(ms: number) {
  const hours = Math.floor(ms / (60 * MINUTE));
  if (hours < 1) return `${Math.max(1, Math.floor(ms / MINUTE))} min left`;
  if (hours < 48) return `${hours} hours left`;
  return `${Math.floor(hours / 24)} days left`;
}

/** Public detail page for one hackathon. Every field comes from Convex. */
export function HackathonDetail({ hackathonKey }: { hackathonKey: string }) {
  const hackathon = useQuery(api.hackathons.getByKey, { key: hackathonKey });
  const { isAuthenticated } = useConvexAuth();
  const recordView = useMutation(api.userLibrary.recordView);
  const hackathonId = hackathon?._id;

  // Signed-in visits feed "Recently opened" and the profile heatmap.
  useEffect(() => {
    if (hackathonId && isAuthenticated) void recordView({ hackathonId });
  }, [hackathonId, isAuthenticated, recordView]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070d] text-white">
      <div className="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -left-32 top-[40rem] h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />

      <TopBar signedIn={isAuthenticated} />

      <main className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        {hackathon === undefined ? (
          <LoadingState />
        ) : hackathon === null ? (
          <NotFound />
        ) : (
          <Detail hackathon={hackathon} signedIn={isAuthenticated} />
        )}
      </main>
    </div>
  );
}

function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <BrandMark className="h-8 w-8" />
        <span className="text-base font-semibold tracking-tight">HackkyHub</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href={signedIn ? "/dashboard#explore" : "/"}
          className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:text-white sm:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" /> {signedIn ? "Explore hackathons" : "Home"}
        </Link>
        {signedIn ? (
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2 text-sm font-medium text-white/85 transition-colors hover:border-violet-300/40 hover:text-white"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.8)]"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function Detail({ hackathon, signedIn }: { hackathon: Hackathon; signedIn: boolean }) {
  const now = useNow();
  const phase = phaseOf(hackathon, now);
  const official = officialUrl(hackathon);
  const banner = safeHttpUrl(hackathon.banner_url);
  const logo = safeHttpUrl(hackathon.logo_url);
  const description = hackathon.description ? plainText(hackathon.description) : "";

  return (
    <>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0c18]"
      >
        <div className="relative h-44 overflow-hidden sm:h-60">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" className="h-full w-full object-cover opacity-85" />
          ) : (
            <div className={cn("relative h-full w-full bg-gradient-to-br", platformGradient(hackathon.platform))}>
              <NetworkField density={0.9} linkDistance={100} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c18] via-[#0b0c18]/40 to-transparent" />
        </div>

        <div className="relative -mt-16 px-5 pb-7 sm:-mt-20 sm:px-9">
          <div className="flex items-end gap-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="h-20 w-20 shrink-0 rounded-2xl border border-white/15 bg-[#11121f] object-cover shadow-xl sm:h-24 sm:w-24"
              />
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-white/15 bg-[#11121f] text-2xl font-semibold uppercase text-white/70 shadow-xl sm:h-24 sm:w-24">
                {hackathon.platform.slice(0, 2)}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <PhaseBadge phase={phase} />
              {hackathon.is_mnc && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                  <Building2 className="h-3 w-3" /> MNC
                </span>
              )}
              <span className="rounded-md border border-white/12 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                {hackathon.is_online ? "Online" : "In person"}
              </span>
            </div>
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-white/40">
            {hackathon.organizer ?? "Organizer not provided"} · <span className="capitalize">{hackathon.platform}</span>
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {hackathon.name}
          </h1>
          {hackathon.themes && hackathon.themes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {hackathon.themes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/65"
                >
                  <Tag className="h-3 w-3 text-violet-300/70" /> {theme}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Content */}
        <div className="min-w-0 space-y-5">
          <Section icon={FileText} title="About" delay={0.05}>
            {description ? (
              <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-white/70">{description}</p>
            ) : (
              <Missing />
            )}
          </Section>

          <Section icon={Layers} title="Tracks" delay={0.1}>
            {hackathon.tracks && hackathon.tracks.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {hackathon.tracks.map((track, i) => (
                  <motion.li
                    key={`${i}-${track}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.35 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/75"
                  >
                    {track}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
          </Section>

          <Section icon={UserCheck} title="Eligibility" delay={0.15}>
            {hackathon.eligibility ? (
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/70">
                {plainText(hackathon.eligibility)}
              </p>
            ) : (
              <Missing />
            )}
          </Section>

          <Section icon={ScrollText} title="Rules & details" delay={0.2}>
            {hackathon.rules ? (
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/70">
                {plainText(hackathon.rules)}
              </p>
            ) : (
              <Missing />
            )}
          </Section>

          <Section icon={Trophy} title="Prizes" delay={0.25}>
            {hackathon.prizes ? (
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/70">
                {plainText(hackathon.prizes)}
              </p>
            ) : typeof hackathon.prize_amount === "number" && hackathon.prize_amount > 0 ? (
              <p className="text-sm text-white/70">
                Total prize pool of {money(hackathon.prize_amount, hackathon.prize_currency)}. Breakdown not provided by source.
              </p>
            ) : (
              <Missing />
            )}
          </Section>
        </div>

        {/* Key facts */}
        <aside className="order-first lg:order-none lg:sticky lg:top-6 lg:self-start">
          <FactsCard hackathon={hackathon} now={now} official={official} signedIn={signedIn} />
        </aside>
      </div>
    </>
  );
}

function FactsCard({
  hackathon,
  now,
  official,
  signedIn,
}: {
  hackathon: Hackathon;
  now: number;
  official: string | null;
  signedIn: boolean;
}) {
  const deadline = toTime(hackathon.registration_deadline);
  const dates = formatDateRange(hackathon.start_date, hackathon.end_date);
  const prize =
    typeof hackathon.prize_amount === "number" && hackathon.prize_amount > 0
      ? money(hackathon.prize_amount, hackathon.prize_currency)
      : null;
  const synced = toTime(hackathon.updated_at) ?? toTime(hackathon.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Deadline */}
      <div className="relative rounded-2xl border border-white/8 bg-black/20 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
          <AlarmClock className="h-3.5 w-3.5" /> Registration deadline
        </p>
        {deadline === null ? (
          <p className="mt-2 text-sm text-white/45">{MISSING}</p>
        ) : deadline > now ? (
          <>
            <p className={cn("mt-2 text-2xl font-semibold tabular-nums", deadline - now < 3 * 24 * 60 * MINUTE ? "text-rose-200" : "text-white")}>
              {timeLeft(deadline - now)}
            </p>
            <p className="mt-0.5 text-xs text-white/45">Closes {formatDay(deadline)}</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-lg font-semibold text-white/60">Closed</p>
            <p className="mt-0.5 text-xs text-white/40">Closed {formatDay(deadline)}</p>
          </>
        )}
      </div>

      <dl className="relative mt-4 space-y-3 text-sm">
        <Fact icon={CalendarDays} label="Dates" value={dates} />
        <Fact
          icon={hackathon.is_online ? Wifi : MapPin}
          label="Where"
          value={hackathon.is_online ? (hackathon.location ? `Online · ${hackathon.location}` : "Online") : (hackathon.location ?? null)}
        />
        <Fact icon={Trophy} label="Prize pool" value={prize} />
        {typeof hackathon.registered_count === "number" && hackathon.registered_count > 0 && (
          <Fact icon={Users} label="Registered (per source)" value={hackathon.registered_count.toLocaleString()} />
        )}
      </dl>

      <div className="relative mt-5 space-y-2.5">
        <ApplyPanel
          hackathon={hackathon}
          official={official}
          closed={(deadline !== null && deadline <= now) || phaseOf(hackathon, now) === "completed"}
          signedIn={signedIn}
        />

        {signedIn && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/65">
            <SaveButton hackathon={hackathon} />
            Save to your library
          </div>
        )}

        <p className="px-1 text-center text-[11px] leading-relaxed text-white/35">
          Registration happens on <span className="capitalize">{hackathon.platform}</span>. HackkyHub lists this event
          but does not run it.
        </p>
      </div>

      <p className="relative mt-4 border-t border-white/8 pt-3 text-[11px] text-white/30">
        <Sparkles className="mr-1 inline h-3 w-3" />
        Source: <span className="capitalize">{hackathon.scraped_from}</span>
        {synced !== null && <> · updated {relativeTime(synced)}</>}
      </p>
    </motion.div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.12em] text-white/35">{label}</dt>
        <dd className={cn("break-words", value ? "text-white/80" : "text-white/40")}>{value ?? MISSING}</dd>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  delay = 0,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <Icon className="h-4 w-4 text-violet-300" /> {title}
      </h2>
      {children}
    </motion.section>
  );
}

function Missing() {
  return <p className="text-sm italic text-white/35">{MISSING}.</p>;
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-72 rounded-[32px]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"
    >
      <p className="font-display text-6xl italic text-white/80">404</p>
      <h1 className="mt-3 text-xl font-semibold">Hackathon not found</h1>
      <p className="mt-2 text-sm text-white/50">
        This link may be wrong, or the event was removed from the source platform.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-white/12 px-4 py-2 text-sm text-white/75 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to hackathons
      </Link>
    </motion.div>
  );
}

export default HackathonDetail;
