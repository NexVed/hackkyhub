"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function MenuToggle({ open, onClick, controls, className }: { open: boolean; onClick: () => void; controls: string; className?: string }) {
  const reduced = useReducedMotion();
  return <button type="button" onClick={onClick} aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls={controls} className={cn("grid size-11 shrink-0 place-items-center rounded-xl border border-current/10 transition-colors", className)}>
    <span className="relative block h-5 w-5" aria-hidden="true">
      {[0, 1, 2].map((line) => <motion.span key={line} className="absolute left-0 top-1/2 h-[1.5px] w-5 rounded-full bg-current" animate={{ y: open ? 0 : (line - 1) * 6, rotate: open ? line === 0 ? 45 : line === 2 ? -45 : 0 : 0, opacity: open && line === 1 ? 0 : 1, scaleX: !open && line === 1 ? 0.7 : 1 }} transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }} />)}
    </span>
  </button>;
}
