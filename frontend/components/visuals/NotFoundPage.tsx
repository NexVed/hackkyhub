"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Compass, Home } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { HackVishvaSignature } from "./HackVishvaSignature";

export function NotFoundPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  return <div className="relative flex min-h-svh flex-col overflow-hidden bg-dash-page text-slate-900 dark:text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(139,92,246,0.12),transparent_65%)]" />
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/" aria-label="HackkyHub home" className="flex items-center gap-3"><BrandMark className="h-9 w-12" /><span className="text-base font-bold tracking-tight">HackkyHub</span></Link>
      <span className="rounded-full border border-violet-400/20 bg-violet-500/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Signal lost</span>
    </header>
    <main className="relative grid flex-1 place-items-center px-5 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.6 }} className="w-full max-w-2xl text-center">
        <div aria-hidden="true" className="relative mx-auto flex h-48 max-w-md items-center justify-center gap-2 font-bold tracking-tighter sm:h-64 sm:gap-4">
          <span className="bg-gradient-to-b from-violet-500 to-violet-500/20 bg-clip-text text-[clamp(7rem,22vw,13rem)] text-transparent">4</span>
          <div className="relative grid size-28 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#ddd6fe,#8b5cf6_45%,#2e1065_90%)] shadow-[0_0_70px_-15px_rgba(139,92,246,0.6)] sm:size-40">
            <div className="absolute inset-4 rounded-full border border-white/20" /><div className="absolute inset-8 rounded-full border border-white/10" />
            <motion.div animate={reduced ? {} : { rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute -inset-x-6 inset-y-8 rounded-[50%] border border-violet-300/40 sm:-inset-x-8"><span className="absolute left-1/2 top-0 size-2.5 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_15px_#5eead4]" /></motion.div>
            <span className="text-4xl font-light text-white/70 sm:text-5xl">0</span>
          </div>
          <span className="bg-gradient-to-b from-teal-500 to-teal-500/20 bg-clip-text text-[clamp(7rem,22vw,13rem)] text-transparent">4</span>
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-700 dark:text-violet-300">404 · Page not found</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">This page drifted<br className="hidden sm:block" /> off course.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500 dark:text-white/45">We couldn’t find that page. A fresh idea, a new team, or your next hackathon is just a click away.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/15 transition hover:bg-violet-500"><Home className="size-4" /> Back to home</Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-violet-400/50 dark:border-white/10 dark:bg-white/5"><Compass className="size-4 text-teal-500" /> Your dashboard <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="mx-auto mt-6 flex min-h-10 items-center gap-2 text-xs text-slate-500 transition hover:text-violet-600 dark:text-white/40 dark:hover:text-violet-300"><ArrowLeft className="size-3.5" /> Go back</button>
      </motion.div>
    </main>
    <footer className="relative flex justify-center px-5 pb-7 pt-3"><HackVishvaSignature compact /></footer>
  </div>;
}
