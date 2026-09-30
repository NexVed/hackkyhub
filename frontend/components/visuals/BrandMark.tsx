"use client";

import { cn } from "@/lib/utils";
import { LiquidMetalLogo } from "@/components/landing/LiquidMetalLogo";

/** Same HH mask and liquid-metal effect as the landing page. */
export function BrandMark({ className }: { className?: string }) {
  return <LiquidMetalLogo className={cn("h-9 w-12 shrink-0", className)} />;
}

export default BrandMark;
