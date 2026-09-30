import { cn } from "@/lib/utils";

type ActivityDay = { t: number; count: number };
const colors = ["bg-slate-900/[0.05] dark:bg-white/[0.05]", "bg-violet-500/30", "bg-violet-500/55", "bg-violet-400/80", "bg-teal-300"];

/** Fixed-size GitHub-style cells; blank padding aligns weeks to Sunday. */
export function ActivityHeatmap({ days, max }: { days: ActivityDay[]; max: number }) {
  const offset = days.length ? new Date(days[0].t).getDay() : 0;
  const columns = Math.ceil((offset + days.length) / 7);
  const months = Array.from({ length: columns }, (_, week) => {
    const first = days[Math.max(0, week * 7 - offset)];
    return first ? new Date(first.t).toLocaleDateString("en", { month: "short" }) : "";
  });
  const labels = months.map((month, index) => index === 0 || month !== months[index - 1] ? month : "");

  return <div className="max-w-full overflow-x-auto pb-1">
    <div className="w-fit" aria-label="Daily activity over the past year">
      <div className="mb-1.5 ml-8 grid auto-cols-[10px] grid-flow-col gap-[3px] text-[10px] leading-3 text-slate-500 dark:text-white/45" aria-hidden="true">
        {labels.map((month, index) => <span key={index} className="overflow-visible whitespace-nowrap">{month}</span>)}
      </div>
      <div className="flex gap-2">
        <div className="grid w-6 shrink-0 grid-rows-7 gap-[3px] text-[9px] leading-[10px] text-slate-500 dark:text-white/40" aria-hidden="true">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => <span key={index}>{label}</span>)}
        </div>
        <div className="grid auto-cols-[10px] grid-flow-col grid-rows-7 gap-[3px]">
          {Array.from({ length: columns * 7 }, (_, index) => {
            const day = days[index - offset];
            if (!day) return <span key={`padding-${index}`} className="size-2.5" aria-hidden="true" />;
            const level = day.count === 0 ? 0 : Math.min(4, Math.ceil(day.count / Math.max(1, max) * 4));
            const label = `${new Date(day.t).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}: ${day.count} action${day.count === 1 ? "" : "s"}`;
            return <span key={day.t} title={label} aria-label={label} className={cn("size-2.5 rounded-[2px] ring-1 ring-inset ring-slate-200 dark:ring-white/5 transition hover:ring-slate-200 dark:hover:ring-white/40", colors[level])} />;
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500 dark:text-white/40" aria-label="Activity intensity from less to more">
        <span>Less</span>{colors.map((color) => <span key={color} aria-hidden="true" className={cn("size-2.5 rounded-[2px]", color)} />)}<span>More</span>
      </div>
    </div>
  </div>;
}
