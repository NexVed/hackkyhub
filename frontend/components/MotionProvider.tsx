"use client";

import { MotionConfig } from "motion/react";

/**
 * Makes every `motion` component follow the OS "reduce motion" setting:
 * transform and layout animations are skipped, opacity fades still run.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export default MotionProvider;
