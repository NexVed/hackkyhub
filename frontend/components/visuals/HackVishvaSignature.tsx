import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./HackVishva.module.css";

export function HackVishvaSignature({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-3", className)} aria-label="Created by Hack Vishva">
    <span className={cn(styles.emblem, "shrink-0 rounded-xl bg-black", compact ? "size-9" : "size-14")}>
      <Image src="/brand/hack-vishva.png" alt="Hack Vishva community logo" width={750} height={750} sizes={compact ? "36px" : "56px"} className="size-full rounded-xl object-contain" />
    </span>
    <span className="flex flex-col gap-1"><span className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">Created by</span><span className={cn(styles.credit, compact ? "text-xs" : "text-base", "font-bold tracking-wide")}>Hack Vishva</span></span>
  </div>;
}
