"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useConvexAuth } from "convex/react";
import styles from "@/components/visuals/HackVishva.module.css";
import { WELCOME_SESSION_KEY } from "@/lib/welcome";

export function WelcomeAnimation({ landing = false }: { landing?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.div role="status" aria-live="polite" aria-label={`${landing ? "Preparing HackkyHub" : "Opening your dashboard"}. Created by Hack Vishva.`} initial={{ opacity: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 1.04 }} transition={{ duration: reduced ? 0 : 0.4 }} className={`fixed inset-0 z-[100] grid place-items-center px-6 ${landing ? "dark bg-black text-white" : "bg-dash-page text-slate-900 dark:text-white"}`}>
    <div className="flex flex-col items-center text-center">
      <motion.div initial={{ opacity: 0, scale: reduced ? 1 : 0.86, y: reduced ? 0 : 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }} className={`${styles.emblem} size-44 rounded-[28px] bg-black sm:size-52`}>
        <Image priority src="/brand/hack-vishva.png" alt="Hack Vishva community logo" width={750} height={750} sizes="(max-width: 639px) 176px, 208px" className="size-full rounded-[28px] object-contain" />
      </motion.div>
      <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-400">Created by</p>
      <p className={`${styles.credit} mt-2 text-2xl font-bold tracking-wide`}>Hack Vishva</p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden="true"><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduced ? 0 : 1.6, ease: "easeInOut" }} className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-orange-400" /></div>
      <p className="mt-4 text-xs text-slate-500 dark:text-zinc-400">{landing ? "Getting your next idea ready…" : "Opening your dashboard…"}</p>
    </div>
  </motion.div>;
}

/** One short welcome per sign-in, shared by email, Google and GitHub. */
export function DashboardWelcome({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const reduced = useReducedMotion();
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) return;
    let seen = false;
    try { seen = sessionStorage.getItem(WELCOME_SESSION_KEY) === "true"; } catch {}
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(WELCOME_SESSION_KEY, "true"); } catch {}
      setComplete(true);
    }, seen ? 0 : reduced ? 300 : 1800);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, reduced]);
  const welcoming = isAuthenticated && !complete;
  return <><div inert={welcoming} aria-hidden={welcoming || undefined} className="h-full min-h-0">{children}</div><AnimatePresence>{welcoming && <WelcomeAnimation />}</AnimatePresence></>;
}
