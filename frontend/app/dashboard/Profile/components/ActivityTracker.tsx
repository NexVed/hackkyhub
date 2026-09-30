"use client";

import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";

/** Compatibility wrapper for the former mock activity widget. Supply real activity. */
export default function ActivityTracker({ days = [], max = 1 }: { days?: { t: number; count: number }[]; max?: number }) {
  return <ActivityHeatmap days={days} max={max} />;
}
