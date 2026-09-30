"use client";

import { AlertCircle } from "lucide-react";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <div className="grid min-h-full place-items-center bg-dash-page p-6 text-slate-900 dark:text-white"><div role="alert" className="max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 p-8 text-center"><AlertCircle className="mx-auto size-9 text-violet-700 dark:text-violet-200" /><h1 className="mt-4 text-xl font-semibold">We couldn’t load this page</h1><p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-white/50">Please try again in a moment. Your saved challenges and teams are still in your account.</p><button onClick={reset} className="mt-6 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400">Try again</button></div></div>;
}
