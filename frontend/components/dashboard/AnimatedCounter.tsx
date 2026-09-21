"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  /** Formats the in-flight value; defaults to a rounded, grouped integer. */
  format?: (value: number) => string;
  className?: string;
};

/**
 * Counts up to `value` once the element scrolls into view, and re-animates
 * from wherever it currently sits whenever the live Convex value changes.
 */
export function AnimatedCounter({
  value,
  duration = 1.1,
  format,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(fromRef.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : Math.round(display).toLocaleString()}
    </span>
  );
}

export default AnimatedCounter;
