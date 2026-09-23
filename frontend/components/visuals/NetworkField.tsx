"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type NetworkFieldProps = {
  className?: string;
  /** Nodes per 10,000 px² of canvas. */
  density?: number;
  /** Max distance (px) at which two nodes are linked. */
  linkDistance?: number;
  /** RGB triplets for nodes; picked at random per node. */
  palette?: [number, number, number][];
  /** Whether the pointer gently pulls nearby nodes and lights links. */
  interactive?: boolean;
};

type Node = { x: number; y: number; vx: number; vy: number; r: number; c: [number, number, number] };

const DEFAULT_PALETTE: [number, number, number][] = [
  [167, 139, 250], // violet
  [96, 165, 250], // blue
  [45, 212, 191], // teal
];

/**
 * A drifting constellation of nodes linked by faint edges: a "network of
 * builders" motif. Pauses when off-screen or in a background tab, and renders
 * a single still frame when the user prefers reduced motion.
 */
export function NetworkField({
  className,
  density = 0.9,
  linkDistance = 120,
  palette = DEFAULT_PALETTE,
  interactive = true,
}: NetworkFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const seed = () => {
      const count = Math.max(18, Math.min(140, Math.round(((width * height) / 10000) * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
        c: palette[Math.floor(Math.random() * palette.length)]!,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(false);
    };

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        if (advance) {
          if (interactive && pointer.active) {
            const dx = pointer.x - n.x;
            const dy = pointer.y - n.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 160 * 160) {
              n.vx += dx * 0.000018;
              n.vy += dy * 0.000018;
            }
          }
          n.vx *= 0.995;
          n.vy *= 0.995;
          // Keep a floor of drift so the field never freezes.
          if (Math.abs(n.vx) < 0.04) n.vx += (Math.random() - 0.5) * 0.02;
          if (Math.abs(n.vy) < 0.04) n.vy += (Math.random() - 0.5) * 0.02;
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDistance) continue;
          let alpha = (1 - dist / linkDistance) * 0.22;
          if (interactive && pointer.active) {
            const mx = (a.x + b.x) / 2 - pointer.x;
            const my = (a.y + b.y) / 2 - pointer.y;
            if (mx * mx + my * my < 140 * 140) alpha *= 2.4;
          }
          ctx.strokeStyle = `rgba(${a.c[0]}, ${a.c[1]}, ${a.c[2]}, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.c[0]}, ${n.c[1]}, ${n.c[2]}, 0.9)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      if (visible && !document.hidden) draw(true);
      frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    if (!reduceMotion) {
      frame = requestAnimationFrame(loop);
      if (interactive) {
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerleave", onLeave);
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [density, linkDistance, palette, interactive, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}

export default NetworkField;
