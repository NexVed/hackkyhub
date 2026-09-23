"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CircleDashed, Loader2, LogIn, Undo2, UserCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

function formatDate(time: number) {
  return new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Apply Now plus personal registration tracking. HackkyHub only records
 * that the user started (clicked through) and, optionally, their own claim
 * that they finished. It never says a registration is confirmed.
 */
export function ApplyPanel({
  hackathon,
  official,
  closed,
  signedIn,
}: {
  hackathon: Doc<"hackathons">;
  official: string | null;
  closed: boolean;
  signedIn: boolean;
}) {
  const hackathonId = hackathon._id;
  const tracking = useQuery(api.registrations.getMine, signedIn ? { hackathonId } : "skip");
  const start = useMutation(api.registrations.start);
  const setSelfReported = useMutation(api.registrations.setSelfReported);
  const remove = useMutation(api.registrations.remove);
  const [pending, setPending] = useState<"report" | "undo" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const platform = hackathon.platform;

  const run = async (kind: "report" | "undo" | "remove", action: () => Promise<unknown>) => {
    setPending(kind);
    setError(null);
    try {
      await action();
    } catch {
      setError("That did not save. Please try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {official === null ? (
        <p className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm text-white/45">
          Official link not provided by source
        </p>
      ) : closed ? (
        <a
          href={official}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          Registration closed · view official page <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <motion.a
          href={official}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // The official site opens in a new tab, so this page stays alive
            // for the mutation to finish. Tracking failures never block Apply.
            if (signedIn) start({ hackathonId }).catch(() => undefined);
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.9)]"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 blur-md motion-safe:animate-[shine_3.2s_ease-in-out_infinite]" />
          {tracking ? (
            <>
              Continue on <span className="capitalize">{platform}</span>
            </>
          ) : (
            "Apply Now"
          )}
          <ArrowUpRight className="h-4 w-4" />
        </motion.a>
      )}

      {!signedIn ? (
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/65 transition-colors hover:text-white"
        >
          <LogIn className="h-4 w-4" /> Sign in to save and track
        </Link>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {tracking === undefined ? null : tracking === null ? (
            official !== null &&
            !closed && (
              <motion.p
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1 text-center text-[11px] leading-relaxed text-white/40"
              >
                Opens <span className="capitalize">{platform}</span> in a new tab and adds this to your registrations.
              </motion.p>
            )
          ) : tracking.selfReportedAt === null ? (
            <motion.div
              key="started"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-amber-300/25 bg-amber-500/[0.07] p-4"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
                <CircleDashed className="h-4 w-4 text-amber-300" /> Registration started
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                You opened the official page on {formatDate(tracking.startedAt)}. Finish registering on{" "}
                <span className="capitalize">{platform}</span>. HackkyHub can&apos;t see whether you completed it.
              </p>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => run("report", () => setSelfReported({ hackathonId, registered: true }))}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:border-emerald-300/40 hover:text-white disabled:opacity-50"
              >
                {pending === "report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                I&apos;ve registered
                <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-white/50">
                  self-reported
                </span>
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => run("remove", () => remove({ hackathonId }))}
                className="mt-2 w-full text-center text-[11px] text-white/35 transition-colors hover:text-white/70 disabled:opacity-50"
              >
                {pending === "remove" ? "Removing…" : "Stop tracking this hackathon"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="reported"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-teal-300/25 bg-teal-500/[0.07] p-4"
            >
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-teal-100">
                <UserCheck className="h-4 w-4 text-teal-300" /> You marked this as registered
                <span className="rounded-md border border-teal-200/25 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-teal-100/70">
                  self-reported
                </span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Marked on {formatDate(tracking.selfReportedAt)}. Not verified by HackkyHub; check your confirmation
                email from <span className="capitalize">{platform}</span>.
              </p>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => run("undo", () => setSelfReported({ hackathonId, registered: false }))}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white disabled:opacity-50"
              >
                {pending === "undo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {error && (
        <p role="alert" className="text-center text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default ApplyPanel;
