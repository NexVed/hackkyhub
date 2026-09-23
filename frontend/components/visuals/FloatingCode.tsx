"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Chip = { text: string; top: string; left: string; delay: number; drift: number; tone: string };

/** Hackathon-flavoured snippets that drift slowly behind the brand copy. */
const CHIPS: Chip[] = [
  { text: "git push origin build", top: "12%", left: "8%", delay: 0, drift: 10, tone: "text-violet-200/70" },
  { text: "npm run ship", top: "24%", left: "62%", delay: 1.2, drift: -12, tone: "text-sky-200/70" },
  { text: "</>", top: "44%", left: "80%", delay: 0.6, drift: 8, tone: "text-teal-200/80" },
  { text: "await submit(project)", top: "68%", left: "10%", delay: 1.8, drift: -9, tone: "text-violet-200/60" },
  { text: "{ team: 4, hours: 48 }", top: "82%", left: "52%", delay: 0.9, drift: 11, tone: "text-sky-200/60" },
  { text: "deploy ✓", top: "56%", left: "44%", delay: 2.4, drift: -7, tone: "text-emerald-200/70" },
];

export function FloatingCode({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {CHIPS.map((chip) => (
        <motion.span
          key={chip.text}
          className={cn(
            "absolute whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1",
            "font-mono text-[11px] backdrop-blur-sm",
            chip.tone,
          )}
          style={{ top: chip.top, left: chip.left }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1], y: [12, 0, chip.drift, 0] }}
          transition={{
            opacity: { duration: 1.2, delay: chip.delay },
            y: {
              duration: 9 + chip.delay,
              delay: chip.delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            },
          }}
        >
          {chip.text}
        </motion.span>
      ))}
    </div>
  );
}

export default FloatingCode;
