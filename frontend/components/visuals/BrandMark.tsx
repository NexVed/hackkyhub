import { cn } from "@/lib/utils";

/** HackkyHub hexagon mark: a node-graph "H" inside a gradient hexagon. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="hh-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5z"
        fill="url(#hh-mark)"
        opacity="0.95"
      />
      <path d="M14 12.5v15M26 12.5v15M14 20h12" stroke="#0b0b14" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="14" cy="12.5" r="1.9" fill="#0b0b14" />
      <circle cx="26" cy="27.5" r="1.9" fill="#0b0b14" />
    </svg>
  );
}

export default BrandMark;
