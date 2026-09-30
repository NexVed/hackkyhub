"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { formatCountdown } from "@/lib/format";
import { displayName } from "@/lib/profile";
import { hackathonPath } from "@/lib/hackathon";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { cn } from "@/lib/utils";
import { ease } from "./primitives";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function DashboardHeader({
  search,
  onSearch,
  onSubmitSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
  onSubmitSearch: () => void;
}) {
  const viewer = useQuery(api.users.viewer, {});
  const alerts = useQuery(api.analytics.getClosingSoon, { limit: 6, days: 3 });
  const inputRef = useRef<HTMLInputElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useDismiss(notifOpen, () => setNotifOpen(false));
  const menuRef = useDismiss(menuOpen, () => setMenuOpen(false));

  const name = displayName(viewer);
  const firstName = name?.split(/\s+/)[0] ?? null;

  // "/" or Ctrl/Cmd+K focuses search, like most developer tools.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
      className="relative z-30 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200/60">{greeting()}</p>
        <p className="font-display mt-1 truncate text-2xl italic text-slate-900 dark:text-white">{firstName ?? "\u00a0"}</p>
      </div>

      <div className="flex items-center gap-2.5">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitSearch();
          }}
          className="group relative flex-1 sm:w-80 sm:flex-none"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-white/35 transition-colors group-focus-within:text-violet-700 dark:group-focus-within:text-violet-300" />
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search hackathons, themes, orgs"
            aria-label="Search hackathons"
            className="h-11 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900/[0.04] dark:bg-white/[0.04] pl-10 pr-12 text-sm text-slate-900 dark:text-white outline-none backdrop-blur-xl transition-all placeholder:text-slate-500 dark:placeholder:text-white/30 focus:border-violet-400/60 focus:bg-slate-900/[0.07] dark:focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 dark:border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:text-white/35 sm:block">
            /
          </kbd>
        </form>

        {/* Notifications: real deadlines inside the next 72 hours */}
        <div ref={notifRef} className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900/[0.04] dark:bg-white/[0.04] text-slate-700 dark:text-white/70 backdrop-blur-xl transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            {alerts && alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.7)]">
                {alerts.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-[calc(100%+10px)] w-[min(340px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-dash-surface/95 shadow-2xl backdrop-blur-2xl"
              >
                <div className="border-b border-slate-200 dark:border-white/8 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Deadlines</p>
                  <p className="text-xs text-slate-500 dark:text-white/40">Registrations closing in the next 72 hours</p>
                </div>
                {alerts === undefined ? (
                  <p className="px-4 py-5 text-sm text-slate-500 dark:text-white/40">Loading…</p>
                ) : alerts.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-slate-500 dark:text-white/40">Nothing closing soon. You are all caught up.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {alerts.map((alert) => (
                      <li key={alert.hackathon._id}>
                        <Link
                          href={hackathonPath(alert.hackathon)}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.05]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-slate-700 dark:text-white/85">{alert.hackathon.name}</span>
                            <span className="block text-xs capitalize text-slate-500 dark:text-white/35">{alert.hackathon.platform}</span>
                          </span>
                          <span className="shrink-0 rounded-md border border-rose-400/30 bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-200">
                            {formatCountdown(alert.hoursLeft)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile menu */}
        <div ref={menuRef} className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-teal-400 p-[1.5px]"
          >
            <UserAvatar
              name={name}
              image={viewer?.image ?? null}
              className="font-display h-full w-full rounded-[14px] bg-dash-surface text-sm font-semibold text-slate-900 dark:text-white"
            />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <ProfileMenu
                name={name}
                email={viewer?.email ?? null}
                onNavigate={() => setMenuOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

function ProfileMenu({ name, email, onNavigate }: { name: string | null; email: string | null; onNavigate: () => void }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-[calc(100%+10px)] w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-dash-surface/95 shadow-2xl backdrop-blur-2xl"
    >
      <div className="border-b border-slate-200 dark:border-white/8 px-4 py-3.5">
        <p className="font-display truncate text-base text-slate-900 dark:text-white">{name ?? "Your account"}</p>
        {email && <p className="truncate text-xs text-slate-500 dark:text-white/40">{email}</p>}
      </div>
      <div className="p-1.5">
        <MenuLink href="/dashboard/Profile" icon={User} label="Your profile" onClick={onNavigate} />
        <MenuLink href="/dashboard/Settings" icon={Settings} label="Settings" onClick={onNavigate} />
        <button
          type="button"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            await signOut();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </motion.div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-white/75 transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white")}
    >
      <Icon className="h-4 w-4 text-slate-500 dark:text-white/45" />
      {label}
    </Link>
  );
}

export default DashboardHeader;
