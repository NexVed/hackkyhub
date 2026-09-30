"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { ArrowRight, Check, Copy, Crown, FolderPlus, KeyRound, Loader2, LogOut, Pencil, Plus, Search, Trash2, Trophy, Users, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { hackathonPath } from "@/lib/hackathon";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { selectTeam, setTeamSearch } from "@/lib/store/dashboardSlice";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EmptyNote, Panel, Skeleton } from "./primitives";

type Team = FunctionReturnType<typeof api.teams.listMine>[number];
const inputClass = "w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-900/5 dark:bg-white/5 px-3.5 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-white/30 focus:border-violet-300/60 focus:ring-2 focus:ring-violet-300/10";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-900/5 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/80 transition hover:bg-slate-900/10 dark:hover:bg-white/10 disabled:opacity-40";
const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-40";

function errorMessage(error: unknown) {
  return error instanceof ConvexError ? String(error.data) : "Could not complete this action. Please try again.";
}

export function TeamsOverview() {
  const teams = useQuery(api.teams.listMine, {});
  const dispatch = useAppDispatch();
  const { selectedTeamId, teamSearch } = useAppSelector((state) => state.dashboard);
  const [form, setForm] = useState<"create" | "edit" | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const remove = useMutation(api.teams.remove);
  const leave = useMutation(api.teams.leave);
  const selected = teams?.find((team) => team._id === selectedTeamId) ?? teams?.[0];
  const filtered = teams?.filter((team) => `${team.name} ${team.description} ${team.skills.join(" ")}`.toLowerCase().includes(teamSearch.toLowerCase().trim()));

  const copyCode = async (team: Team) => {
    setError(null);
    try { await navigator.clipboard.writeText(team.inviteCode); setCopiedCode(team.inviteCode); }
    catch { setError("Could not copy. Select and copy the invitation code below."); }
  };

  const exitTeam = async (team: Team) => {
    setBusy(true); setError(null);
    try {
      if (team.isOwner) await remove({ teamId: team._id });
      else await leave({ teamId: team._id });
      dispatch(selectTeam(null)); setConfirm(null); setForm(null);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-dash-page text-slate-900 dark:text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 size-[32rem] rounded-full bg-blue-600/15 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700 dark:text-blue-200/70">Build together</p><h1 className="font-display mt-2 text-3xl italic sm:text-4xl">Your teams</h1><p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-white/50">Bring your people, combine your skills, and find your next challenge.</p></div>
          <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => { setJoinOpen(!joinOpen); setForm(null); }}><KeyRound className="size-4" /> Join a team</button><button className={primaryClass} onClick={() => { setForm(form === "create" ? null : "create"); setJoinOpen(false); }}><Plus className="size-4" /> Create team</button></div>
        </header>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Your teams", value: teams?.length, icon: Users },
            { label: "Teams you lead", value: teams?.filter((team) => team.isOwner).length, icon: Crown },
            { label: "Linked challenges", value: teams?.filter((team) => team.hackathon).length, icon: Trophy },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5"><Icon className="size-5 shrink-0 text-blue-700 dark:text-blue-200" /><div><p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-white/45 sm:text-xs">{label}</p></div></div>)}
        </div>
        {joinOpen && <JoinForm onClose={() => setJoinOpen(false)} onJoined={(id) => { dispatch(selectTeam(id)); setJoinOpen(false); }} />}
        {form && (form === "create" || selected?.isOwner) && <TeamForm key={form === "edit" ? selected?._id : "create"} team={form === "edit" ? selected : undefined} onClose={() => setForm(null)} onSaved={(id) => { dispatch(selectTeam(id)); setForm(null); }} />}
        {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-700 dark:text-rose-200">{error}</p>}
        {teams === undefined ? <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div> : teams.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-200 dark:border-white/15 bg-slate-900/[0.025] dark:bg-white/[0.025] px-6 py-16 text-center"><div className="mx-auto grid size-20 place-items-center rounded-3xl bg-blue-400/10"><FolderPlus className="size-9 text-blue-700 dark:text-blue-200" /></div><h2 className="mt-6 text-xl font-semibold">Great builds start with a great team.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-white/45">Create a space for your next hackathon and share an invitation code with your teammates. Already have a code? Join their team.</p><button className={cn(primaryClass, "mt-6")} onClick={() => { setForm("create"); setJoinOpen(false); }}><Plus className="size-4" /> Create your first team</button></section>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <Panel title="Team spaces" subtitle="Up to 20 teams · 10 members per team">
              <label className="relative mb-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-white/35" /><input aria-label="Search your teams" value={teamSearch} onChange={(e) => dispatch(setTeamSearch(e.target.value))} placeholder="Search teams or skills" className={cn(inputClass, "pl-10")} /></label>
              {filtered?.length === 0 ? <EmptyNote><span>No teams match. <button onClick={() => dispatch(setTeamSearch(""))} className="text-violet-700 dark:text-violet-200 underline">Clear search</button></span></EmptyNote> : <div className="space-y-3">{filtered?.map((team) => <button key={team._id} onClick={() => { dispatch(selectTeam(team._id)); setForm(null); setConfirm(null); setError(null); }} aria-pressed={selected?._id === team._id} className={cn("w-full rounded-2xl border p-4 text-left transition hover:border-blue-300/40", selected?._id === team._id ? "border-blue-300/40 bg-blue-400/10" : "border-slate-200 dark:border-white/10 bg-slate-900/[0.025] dark:bg-white/[0.025]")}><div className="flex items-center justify-between gap-3"><h3 className="truncate font-semibold">{team.name}</h3>{team.isOwner && <Crown className="size-4 shrink-0 text-amber-700 dark:text-amber-200" aria-label="Team owner" />}</div><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-white/45">{team.description || "Your next project starts here."}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-white/45"><span>{team.members.length} / 10 members</span><ArrowRight className="size-4 text-blue-700 dark:text-blue-200" /></div></button>)}</div>}
            </Panel>
            {selected && <div className="space-y-5">
              <Panel title={selected.name} subtitle={selected.isOwner ? "You lead this team" : "You are a team member"} action={selected.isOwner ? <button className="rounded-lg p-2 text-slate-500 dark:text-white/55 hover:bg-slate-900/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white" aria-label="Edit team" onClick={() => { setForm("edit"); setJoinOpen(false); }}><Pencil className="size-4" /></button> : null}>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-500 dark:text-white/55">{selected.description || "No description yet. Add your goal and what you want to build."}</p>
                {selected.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selected.skills.map((skill) => <span key={skill} className="rounded-full border border-blue-300/20 bg-blue-400/5 px-3 py-1 text-xs text-blue-700 dark:text-blue-100">{skill}</span>)}</div>}
                <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-5"><p className="mb-4 text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-white/35">The builders · {selected.members.length}</p><ul className="space-y-4">{selected.members.map((member) => <li key={member._id} className="flex items-center gap-3"><UserAvatar name={member.name} image={member.image} className="size-10 shrink-0 rounded-full bg-violet-400/10 text-sm text-violet-700 dark:text-violet-100" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.name}</p><p className="truncate text-xs text-slate-500 dark:text-white/40">{member.headline ?? "Team member"}</p></div>{member.userId === selected.ownerId && <span className="flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-200"><Crown className="size-3" /> Owner</span>}</li>)}</ul></div>
              </Panel>
              <Panel title="Next challenge" subtitle="A shared goal for your team">
                {selected.hackathon ? <Link href={hackathonPath(selected.hackathon)} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 p-4 transition hover:border-violet-300/40"><Trophy className="size-5 shrink-0 text-violet-700 dark:text-violet-200" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selected.hackathon.name}</p><p className="mt-1 text-xs capitalize text-slate-500 dark:text-white/40">{selected.hackathon.platform}</p></div><ArrowRight className="size-4 shrink-0" /></Link> : <p className="text-sm leading-relaxed text-slate-500 dark:text-white/45">{selected.isOwner ? "Save a hackathon from the explorer, then edit your team to link it here." : "Your team owner can link a hackathon here."}</p>}
                <Link href="/dashboard/Find" className="mt-4 inline-flex items-center gap-2 text-xs text-violet-700 dark:text-violet-200 hover:underline">Explore challenges <ArrowRight className="size-3" /></Link>
              </Panel>
              <Panel title="Invite your teammates" subtitle="Anyone with this code can join, up to 10 members">
                <div className="flex flex-wrap items-center gap-3"><code className="min-w-0 flex-1 select-all break-all rounded-xl bg-slate-100 dark:bg-black/25 p-3 text-xs text-blue-700 dark:text-blue-100">{selected.inviteCode}</code><button className={buttonClass} onClick={() => copyCode(selected)}>{copiedCode === selected.inviteCode ? <Check className="size-4" /> : <Copy className="size-4" />}{copiedCode === selected.inviteCode ? "Copied" : "Copy"}</button></div>
                <p className="mt-3 text-xs text-slate-500 dark:text-white/35">Teammates can enter this code using “Join a team”.</p>
              </Panel>
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                {confirm === selected._id ? <div role="alert" className="space-y-3"><p className="text-sm text-slate-700 dark:text-white/65">{selected.isOwner ? `Delete ${selected.name} for all ${selected.members.length} members? This cannot be undone.` : `Leave ${selected.name}? You can rejoin with an invitation code.`}</p><div className="flex gap-2"><button disabled={busy} onClick={() => exitTeam(selected)} className={cn(buttonClass, "border-rose-400/30 text-rose-700 dark:text-rose-200")}>{busy && <Loader2 className="size-4 animate-spin" />}{selected.isOwner ? "Delete team" : "Leave team"}</button><button disabled={busy} className={buttonClass} onClick={() => setConfirm(null)}>Cancel</button></div></div> : <button className="inline-flex items-center gap-2 text-xs text-rose-700 dark:text-rose-200/70 hover:text-rose-700 dark:hover:text-rose-200" onClick={() => setConfirm(selected._id)}>{selected.isOwner ? <Trash2 className="size-4" /> : <LogOut className="size-4" />}{selected.isOwner ? "Delete team" : "Leave team"}</button>}
              </div>
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamForm({ team, onClose, onSaved }: { team?: Team; onClose: () => void; onSaved: (id: string) => void }) {
  const create = useMutation(api.teams.create);
  const update = useMutation(api.teams.update);
  const saved = useQuery(api.userLibrary.listSaved, { limit: 100 });
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [skills, setSkills] = useState(team?.skills.join(", ") ?? "");
  const [hackathonId, setHackathonId] = useState(team?.hackathonId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = saved?.map((item) => item.hackathon) ?? [];
  if (team?.hackathon && !options.some((h) => h._id === team.hackathon!._id)) options.unshift(team.hackathon);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const fields = { name, description, skills: skills.split(",").map((s) => s.trim()).filter(Boolean), hackathonId: hackathonId ? hackathonId as Id<"hackathons"> : undefined };
      if (team) { await update({ ...fields, teamId: team._id }); onSaved(team._id); }
      else { const id = await create({ ...fields, inviteCode: crypto.randomUUID() }); onSaved(id); }
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return <Panel title={team ? "Edit your team" : "Create a team"} subtitle="Give your next build a home" action={<button disabled={busy} aria-label="Close team form" onClick={onClose} className="p-1 text-slate-500 dark:text-white/50"><X className="size-5" /></button>}><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm text-slate-700 dark:text-white/70"><span>Team name</span><input autoFocus required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight Builders" className={inputClass} /></label><label className="space-y-2 text-sm text-slate-700 dark:text-white/70"><span>Skills <span className="text-xs text-slate-500 dark:text-white/35">optional</span></span><input maxLength={246} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, Design" className={inputClass} /><span className="block text-xs text-slate-500 dark:text-white/35">Up to 8 skills, separated by commas.</span></label><label className="space-y-2 text-sm text-slate-700 dark:text-white/70 sm:col-span-2"><span>What are you building? <span className="text-xs text-slate-500 dark:text-white/35">optional</span></span><textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Your idea, goals, or the skills you’re looking for…" className={cn(inputClass, "resize-y")} /></label><label className="space-y-2 text-sm text-slate-700 dark:text-white/70 sm:col-span-2"><span>Link a saved hackathon <span className="text-xs text-slate-500 dark:text-white/35">optional</span></span><CustomSelect value={hackathonId} onValueChange={(value) => setHackathonId(value as Id<"hackathons"> | "")} ariaLabel="Link a saved hackathon" options={[{ value: "", label: "No challenge selected" }, ...options.map(h => ({ value: h._id, label: h.name }))]} className="w-full text-sm" disabled={busy} /></label>{error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-200 sm:col-span-2">{error}</p>}<div className="flex gap-2 sm:col-span-2"><button disabled={busy || name.trim().length < 2} className={primaryClass}>{busy && <Loader2 className="size-4 animate-spin" />}{busy ? "Saving…" : team ? "Save changes" : "Create team"}</button><button type="button" disabled={busy} onClick={onClose} className={buttonClass}>Cancel</button></div></form></Panel>;
}

function JoinForm({ onClose, onJoined }: { onClose: () => void; onJoined: (id: string) => void }) {
  const join = useMutation(api.teams.join);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <Panel title="Join a team" subtitle="Enter the invitation code shared by your teammate" action={<button aria-label="Close join form" disabled={busy} onClick={onClose} className="p-1 text-slate-500 dark:text-white/50"><X className="size-5" /></button>}><form className="flex flex-wrap gap-3" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(null); try { onJoined(await join({ inviteCode: code.trim() })); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }}><input autoFocus required maxLength={36} autoComplete="off" aria-label="Team invitation code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your invitation code" className={cn(inputClass, "min-w-0 flex-1 sm:min-w-64")} /><button disabled={busy || !code.trim()} className={primaryClass}>{busy && <Loader2 className="size-4 animate-spin" />}Join team</button>{error && <p role="alert" className="w-full text-sm text-rose-700 dark:text-rose-200">{error}</p>}</form></Panel>;
}
