"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const FRAME_COUNT = 240;
const FPS = 24;
const SEQUENCE_VERSION = "20260913-190859";
export function HeroFramePlayer({ active = true, onReady }: { active?: boolean; onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const readyRef = useRef(onReady);
  const reduced = useReducedMotion();
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { readyRef.current = onReady; }, [onReady]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;
    const mobile = matchMedia("(max-width: 639px)").matches;
    const isReduced = reduced ?? matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bufferSize = isReduced ? 1 : mobile ? 12 : 24;
    const frames = new Map<number, HTMLImageElement>();
    const pending = new Set<number>();
    const failed = new Set<number>();
    let index = 0, raf = 0, last = 0, stopped = false, notified = false, visible = true;
    const draw = (img: HTMLImageElement) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const isMobile = matchMedia("(max-width: 639px)").matches;
      const scale = isMobile ? Math.min(width / img.naturalWidth, height / img.naturalHeight) : Math.max(width / img.naturalWidth, height / img.naturalHeight) * 1.12;
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (width-w)/2, isMobile ? (height-h)/2 : height-h, w, h);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.max(1, Math.floor(rect.width*dpr));
      canvas.height = Math.max(1, Math.floor(rect.height*dpr));
      const img = frames.get(index);
      if (img) draw(img);
    };
    const pump = () => {
      if (stopped) return;
      const wanted = Array.from({ length: bufferSize }, (_, offset) => (index+offset)%FRAME_COUNT);
      // Keep a small rolling window, rather than decoding all 240 images at once.
      for (const slot of frames.keys()) if (!wanted.includes(slot)) frames.delete(slot);
      for (const slot of wanted) {
        if (pending.size >= 4) break;
        if (frames.has(slot) || pending.has(slot) || failed.has(slot)) continue;
        pending.add(slot);
        const img = new Image();
        img.decoding = "async";
        img.onload = async () => {
          try { await img.decode(); } catch { /* onload already guarantees drawable pixels. */ }
          pending.delete(slot);
          if (stopped) return;
          frames.set(slot,img);
          if (slot === index) draw(img);
          if (!notified && frames.has(index) && frames.size >= Math.min(bufferSize, isReduced ? 1 : 6)) { notified = true; readyRef.current?.(); }
          pump();
        };
        img.onerror = () => { pending.delete(slot); failed.add(slot); pump(); };
        img.src = `/hero-seq/${String(slot).padStart(3,"0")}.webp?v=${SEQUENCE_VERSION}`;
      }
    };
    const tick = (time: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (!activeRef.current || !visible || document.hidden || time-last < 1000/FPS) return;
      last = time;
      const next = (index+1)%FRAME_COUNT;
      const img = frames.get(next);
      // Hold the displayed frame on slow connections; don't skip across the sequence.
      if (img) { index = next; draw(img); pump(); }
      else if (failed.has(next)) { index = next; pump(); }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    intersection.observe(canvas);
    resize(); pump();
    if (!isReduced) raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect(); frames.clear(); };
  }, [reduced]);
  return <canvas ref={canvasRef} className="h-full w-full" data-liquid-glass-source="hero" aria-hidden />;
}
