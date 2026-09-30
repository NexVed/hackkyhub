"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuToggle } from "@/components/ui/MenuToggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronsLeft, Compass, Folder, Home, LayoutDashboard, Loader2, LogOut, Moon, Settings, Sun, Trophy, User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { setActiveAction, setMobileMenuOpen, toggleIsCollapsed, toggleIsTeamsOpen } from "@/lib/store/sidebarSlice";
import { selectTeam } from "@/lib/store/dashboardSlice";
import { displayName } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { BrandMark } from "@/components/visuals/BrandMark";
import { HackVishvaSignature } from "@/components/visuals/HackVishvaSignature";

const navigation = [
  { key: "home", label: "Home", mobile: "Home", path: "/dashboard/Home", icon: Home, tone: "text-rose-500 dark:text-rose-300" },
  { key: "find", label: "Find hackathons", mobile: "Explore", path: "/dashboard/Find", icon: Compass, tone: "text-violet-600 dark:text-violet-300" },
  { key: "hackathons", label: "MNC hackathons", mobile: "MNC", path: "/dashboard/mnc-hackathons", icon: Trophy, tone: "text-amber-600 dark:text-amber-200" },
  { key: "teams", label: "Teams", mobile: "Teams", path: "/dashboard/Teams", icon: Folder, tone: "text-blue-600 dark:text-blue-300" },
  { key: "dashboard", label: "Dashboard", mobile: "Stats", path: "/dashboard", icon: LayoutDashboard, tone: "text-teal-600 dark:text-teal-200" },
  { key: "profile", label: "Profile", mobile: "Profile", path: "/dashboard/Profile", icon: User, tone: "text-pink-600 dark:text-pink-300" },
  { key: "settings", label: "Settings", mobile: "Settings", path: "/dashboard/Settings", icon: Settings, tone: "text-indigo-600 dark:text-indigo-300" },
] as const;

export function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer, {});
  const teams = useQuery(api.teams.listMine, {});
  const { isCollapsed, isTeamsOpen, activeAction, isMobileMenuOpen } = useAppSelector((state) => state.sidebar);
  const selectedTeamId = useAppSelector((state) => state.dashboard.selectedTeamId);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userName = displayName(viewer);
  const active = (path: string) => path === "/dashboard" ? pathname === path : decodeURIComponent(pathname).startsWith(decodeURIComponent(path));
  const logout = async () => {
    setSigningOut(true); setError(null);
    try { await signOut(); router.push("/login"); }
    catch { setError("Could not sign out. Try again."); setSigningOut(false); }
  };


  const reduced = useReducedMotion();
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current?.querySelector("button");
    const main = document.getElementById("dashboard-content");
    main?.setAttribute("inert", "");
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusable().find((el) => el.getAttribute("aria-label") === "Close navigation menu")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(setMobileMenuOpen(false));
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || !drawer?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !drawer?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const onResize = () => { if (breakpoint.matches) dispatch(setMobileMenuOpen(false)); };
    breakpoint.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      main?.removeAttribute("inert");
      document.removeEventListener("keydown", onKey);
      breakpoint.removeEventListener("change", onResize);
      trigger?.focus();
    };
  }, [isMobileMenuOpen, dispatch]);

  const sidebarContent = (collapsed: boolean, mobile = false) => <>
      <div className={cn("relative flex h-24 shrink-0 items-center", collapsed ? "justify-center" : "px-5")}>
        <Link href="/dashboard/Home" onClick={() => dispatch(setMobileMenuOpen(false))} aria-label="HackkyHub home" className="flex min-w-0 items-center gap-2.5"><BrandMark className="h-9 w-12" />{!collapsed && <span className="text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">HackkyHub</span>}</Link>
        {!mobile && <button onClick={() => dispatch(toggleIsCollapsed())} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-9 grid size-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-white/15 dark:bg-[#1b1b26] dark:text-slate-400 dark:hover:text-white"><ChevronsLeft className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} /></button>}
        {mobile && <MenuToggle open onClick={() => dispatch(setMobileMenuOpen(false))} controls="mobile-dashboard-menu" className="ml-auto text-slate-700 dark:text-white" />}
      </div>
      <nav aria-label="Dashboard navigation" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) dispatch(setMobileMenuOpen(false)); }} className="custom-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden border-t border-slate-200/60 px-3 py-5 dark:border-white/5">
        {navigation.map((item) => <div key={item.key}>
          <div className="flex items-center gap-1">
            <Link href={item.path} title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined} aria-current={active(item.path) ? "page" : undefined} className={cn("flex min-h-11 min-w-0 flex-1 items-center rounded-xl text-sm font-medium transition-colors", collapsed ? "justify-center px-1" : "gap-3 px-3", active(item.path) ? cn("bg-violet-500/10 shadow-[inset_3px_0_0_#8b5cf6] dark:bg-violet-500/15", item.tone) : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white")}><item.icon className="size-[18px] shrink-0" />{!collapsed && <span className="truncate">{item.label}</span>}</Link>
            {item.key === "teams" && !collapsed && <button onClick={() => dispatch(toggleIsTeamsOpen())} aria-label={isTeamsOpen ? "Hide teams" : "Show teams"} aria-expanded={isTeamsOpen} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><ChevronDown className={cn("size-4 transition-transform", !isTeamsOpen && "-rotate-90")} /></button>}
          </div>
          {item.key === "teams" && !collapsed && isTeamsOpen && <div className="my-2 ml-5 space-y-1 border-l border-slate-200 pl-3 dark:border-white/10">{teams === undefined ? <p className="px-2 py-2 text-xs text-slate-500">Loading teams…</p> : teams.length === 0 ? <Link href="/dashboard/Teams" className="block px-2 py-2 text-xs text-blue-500 dark:text-blue-300">Create your first team →</Link> : teams.slice(0, 3).map((team, i) => <Link key={team._id} href="/dashboard/Teams" onClick={() => dispatch(selectTeam(team._id))} className={cn("block truncate rounded-lg px-2 py-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-white/5", active("/dashboard/Teams") && (selectedTeamId === team._id || (!selectedTeamId && i === 0)) ? "bg-blue-400/10 text-blue-600 dark:text-blue-200" : "text-slate-500 dark:text-slate-400")}>{team.name}</Link>)}</div>}
        </div>)}
      </nav>
      <div className="shrink-0 space-y-3 p-3">
        {!collapsed && <HackVishvaSignature compact className="px-2" />}
        <div aria-label="Theme" className={cn("flex rounded-2xl bg-slate-100 p-1 dark:bg-white/5", collapsed && "flex-col")}>
          {([{ key: "sun", label: "Light", icon: Sun }, { key: "moon", label: "Dark", icon: Moon }] as const).map(({ key, label, icon: Icon }) => <button key={key} onClick={() => dispatch(setActiveAction(key))} aria-label={`${label} theme`} aria-pressed={activeAction === key} title={collapsed ? `${label} theme` : undefined} className={cn("flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition", activeAction === key ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 dark:text-slate-400")}><Icon className="size-4" />{!collapsed && label}</button>)}
        </div>
        <div className={cn("flex items-center gap-2 border-t border-slate-200/70 pt-3 dark:border-white/10", collapsed && "flex-col")}>
          <Link href="/dashboard/Profile" onClick={() => dispatch(setMobileMenuOpen(false))} aria-label="Your profile" className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-xl", collapsed && "flex-none")}><UserAvatar name={userName} image={viewer?.image ?? null} className="size-10 shrink-0 rounded-full border border-violet-300/25 bg-violet-400/10 text-sm text-violet-700 dark:text-violet-200" />{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold">{userName ?? "Your account"}</p><p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{viewer?.location ?? viewer?.email ?? ""}</p></div>}</Link>
          <button onClick={logout} disabled={signingOut} aria-label="Log out" title="Log out" className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300">{signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}</button>
        </div>
        {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
      </div>
  </>;
  return <>
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-[#101018]/95 dark:text-white md:hidden">
      <Link href="/dashboard/Home" className="flex items-center gap-2.5" aria-label="HackkyHub home"><BrandMark className="h-9 w-12" /><span className="text-base font-bold tracking-tight">HackkyHub</span></Link>
      <div className="flex items-center gap-2"><button onClick={() => dispatch(setActiveAction(activeAction === "moon" ? "sun" : "moon"))} className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5" aria-label={activeAction === "moon" ? "Use light theme" : "Use dark theme"}>{activeAction === "moon" ? <Sun className="size-5" /> : <Moon className="size-5" />}</button><div ref={triggerRef}><MenuToggle open={isMobileMenuOpen} onClick={() => dispatch(setMobileMenuOpen(!isMobileMenuOpen))} controls="mobile-dashboard-menu" className="hover:bg-violet-500/10" /></div></div>
    </header>
    <AnimatePresence>
      {isMobileMenuOpen && <>
        <motion.div aria-hidden="true" onClick={() => dispatch(setMobileMenuOpen(false))} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="fixed inset-0 z-60 bg-slate-950/50 backdrop-blur-sm md:hidden" />
        <motion.aside ref={drawerRef} id="mobile-dashboard-menu" role="dialog" aria-modal="true" aria-label="Dashboard navigation" initial={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }} animate={{ x: 0, opacity: 1 }} exit={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-70 flex w-[min(340px,calc(100vw-24px))] flex-col border-l border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] text-slate-800 shadow-2xl dark:border-white/10 dark:bg-[#101018] dark:text-slate-200 md:hidden">
          {sidebarContent(false, true)}
        </motion.aside>
      </>}
    </AnimatePresence>
    <aside className={cn("relative z-40 hidden h-full shrink-0 flex-col border-r border-slate-200/70 bg-white/80 text-slate-800 backdrop-blur-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#101018]/90 dark:text-slate-200 md:flex", isCollapsed ? "w-[76px]" : "w-[260px]")}>
      {sidebarContent(isCollapsed)}
    </aside>
  </>;
}
