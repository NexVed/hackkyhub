"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, Bookmark, Compass, LayoutDashboard, Sparkles, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { displayName } from "@/lib/profile";
import { relativeTime } from "@/lib/format";
import { DashboardHeader } from "./DashboardHeader";
import { HackathonCard, HackathonRow } from "./HackathonCards";
import { MyAgenda } from "./MyAgenda";
import { EmptyNote, ListSkeleton, Panel, Skeleton } from "./primitives";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { setExplorerFilters } from "@/lib/store/dashboardSlice";
import { useRouter } from "next/navigation";

export function HomeOverview() {
  const viewer = useQuery(api.users.viewer, {});
  const saved = useQuery(api.userLibrary.listSaved, { limit: 6 });
  const library = useQuery(api.userLibrary.getMyLibraryStats, {});
  const featured = useQuery(api.analytics.getFeatured, { limit: 3 });
  const recent = useQuery(api.userLibrary.listRecentlyViewed, { limit: 4 });
  const teams = useQuery(api.teams.listMine, {});
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useAppSelector((state) => state.dashboard.explorers.find.search);
  const name = displayName(viewer)?.split(/\s+/)[0];

  return (
    <div className="relative min-h-full overflow-hidden bg-dash-page text-slate-900 dark:text-white">
      <div className="pointer-events-none absolute -right-20 -top-40 size-[36rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader search={search} onSearch={(search) => dispatch(setExplorerFilters({ scope: "find", filters: { search } }))} onSubmitSearch={() => router.push("/dashboard/Find")} />
        <section className="relative overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/15 via-indigo-500/5 to-teal-400/5 p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-6 top-0 size-64 rounded-full border border-slate-200 dark:border-white/5 sm:size-80"><div className="absolute inset-10 rounded-full border border-slate-200 dark:border-white/5" /><div className="absolute inset-20 rounded-full border border-slate-200 dark:border-white/5" /></div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200"><Sparkles className="size-4" /> Your launchpad</p>
          <h1 className="font-display relative mt-4 max-w-xl break-words text-3xl italic leading-tight sm:text-5xl">Ready for your next<br />big idea{name ? `, ${name}` : ""}?</h1>
          <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-white/55">Discover a challenge, bring your team together, and keep every deadline in sight. Your next build starts here.</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/Find" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 dark:bg-white dark:text-[#131020] dark:hover:bg-violet-100">Explore hackathons <ArrowRight className="size-4" /></Link>
            <Link href="/dashboard/Teams" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-900/5 dark:bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-slate-900/10 dark:hover:bg-white/10"><Users className="size-4" /> Your teams</Link>
          </div>
        </section>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { title: "Saved challenges", value: library?.saved, icon: Bookmark, detail: "Your personal shortlist" },
            { title: "Upcoming saved", value: library?.savedUpcoming, icon: Compass, detail: "Ideas to plan ahead for" },
            { title: "Your teams", value: teams?.length, icon: Users, detail: "People you build with" },
          ].map(({ title, value, icon: Icon, detail }) => <div key={title} className="flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5"><span className="rounded-xl bg-violet-400/10 p-2 text-violet-700 dark:text-violet-200 sm:p-3"><Icon className="size-5" /></span><div><p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p><p className="text-[11px] text-slate-700 dark:text-white/70 sm:text-sm">{title}</p><p className="mt-1 hidden text-xs text-slate-500 dark:text-white/35 sm:block">{detail}</p></div></div>)}
        </div>
        <MyAgenda />
        <Panel title="Your shortlist" subtitle="Pick up where you left off" action={<Link href="/dashboard/Profile" className="text-xs text-violet-700 dark:text-violet-200 hover:underline">View library →</Link>}>
          {saved === undefined ? <ListSkeleton /> : saved.length === 0 ? <EmptyNote><span>No saved challenges yet. <Link href="/dashboard/Find" className="text-violet-700 dark:text-violet-200 underline">Explore hackathons</Link> and bookmark the ones you love.</span></EmptyNote> : <ul className="grid gap-3 lg:grid-cols-2">{saved.map((item, i) => <HackathonRow key={item.hackathon._id} hackathon={item.hackathon} index={i} badge={`saved ${relativeTime(item.at)}`} />)}</ul>}
        </Panel>
        <Panel title="Worth a look" subtitle="Open challenges with the largest listed prize pools" action={<Link href="/dashboard/Find" className="text-xs text-violet-700 dark:text-violet-200 hover:underline">Explore all →</Link>}>
          {featured === undefined ? <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div> : featured.length === 0 ? <EmptyNote>New open challenges will appear here when available.</EmptyNote> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featured.map((item, i) => <HackathonCard key={item.hackathon._id} hackathon={item.hackathon} phase={item.phase} index={i} />)}</div>}
        </Panel>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Recently explored" subtitle="Continue discovering">
            {recent === undefined ? <ListSkeleton /> : recent.length === 0 ? <EmptyNote>Challenges you open will appear here.</EmptyNote> : <ul className="space-y-2.5">{recent.map((item, i) => <HackathonRow key={item.hackathon._id} hackathon={item.hackathon} index={i} badge={relativeTime(item.at)} />)}</ul>}
          </Panel>
          <Panel title="See the bigger picture" subtitle="Across every platform">
            <LayoutDashboard className="size-9 text-teal-700 dark:text-teal-200/80" /><p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-white/50">Compare prize pools, see what’s trending, and explore upcoming hackathons in your dashboard.</p><Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-200">Open dashboard <ArrowRight className="size-4" /></Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
