"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { CircleDashed, UserCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { toTime } from "@/convex/lib/phase";
import { formatCountdown, relativeTime } from "@/lib/format";
import { HackathonRow } from "./HackathonCards";
import { EmptyNote, ListSkeleton, Panel } from "./primitives";

const MINUTE = 60 * 1000;

/** Current time, refreshed every minute, so countdowns stay honest. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), MINUTE);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The signed-in user's own two lists: registrations they started, and the
 * deadlines of hackathons they saved or started. Both are personal; nothing
 * here is a site-wide statistic.
 */
export function MyAgenda() {
  const registrations = useQuery(api.registrations.listMine, { limit: 25 });
  const saved = useQuery(api.userLibrary.listSaved, { limit: 50 });
  const now = useNow();

  const deadlines = useMemo(() => {
    if (registrations === undefined || saved === undefined) return undefined;
    const byId = new Map<string, { hackathon: Doc<"hackathons">; reason: string; at: number }>();
    const add = (hackathon: Doc<"hackathons">, reason: string) => {
      const at = toTime(hackathon.registration_deadline);
      if (at === null || at <= now) return;
      // "Registered" wins over "Saved" when both apply.
      if (!byId.has(hackathon._id) || reason !== "saved") byId.set(hackathon._id, { hackathon, reason, at });
    };
    for (const item of saved) add(item.hackathon, "saved");
    for (const item of registrations) add(item.hackathon, item.selfReportedAt === null ? "started" : "registered");
    return [...byId.values()].sort((a, b) => a.at - b.at).slice(0, 6);
  }, [registrations, saved, now]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Your registrations"
        subtitle="Hackathons you opened to register"
        delay={0.05}
        action={
          registrations && registrations.length > 0 ? (
            <span className="text-xs text-white/40">{registrations.length} tracked</span>
          ) : null
        }
      >
        {registrations === undefined ? (
          <ListSkeleton />
        ) : registrations.length === 0 ? (
          <EmptyNote>
            Nothing yet. Open a hackathon and use Apply Now; it is recorded here while you finish on the
            platform&apos;s own site.
          </EmptyNote>
        ) : (
          <ul className="space-y-2.5">
            {registrations.slice(0, 6).map((item, i) => (
              <HackathonRow
                key={item.hackathon._id}
                index={i}
                hackathon={item.hackathon}
                badge={item.selfReportedAt === null ? `started ${relativeTime(item.startedAt)}` : "self-reported"}
              />
            ))}
          </ul>
        )}
        {registrations && registrations.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/35">
            <CircleDashed className="h-3 w-3" /> started ·
            <UserCheck className="h-3 w-3" /> self-reported, not verified by HackkyHub
          </p>
        )}
      </Panel>

      <Panel title="Your deadlines" subtitle="Saved or started, soonest first" delay={0.1}>
        {deadlines === undefined ? (
          <ListSkeleton />
        ) : deadlines.length === 0 ? (
          <EmptyNote>
            No upcoming deadlines in your list. Save a hackathon or start a registration and it appears here.
          </EmptyNote>
        ) : (
          <ul className="space-y-2.5">
            {deadlines.map((item, i) => {
              const hoursLeft = Math.max(0, Math.round((item.at - now) / (60 * MINUTE)));
              return (
                <HackathonRow
                  key={item.hackathon._id}
                  index={i}
                  hackathon={item.hackathon}
                  badge={`${item.reason} · ${formatCountdown(hoursLeft)}`}
                  urgent={hoursLeft <= 48}
                />
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default MyAgenda;
