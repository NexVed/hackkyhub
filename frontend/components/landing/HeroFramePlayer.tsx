"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 240;
const FPS = 24;
const LOAD_WORKERS = 6;
const SEQUENCE_VERSION = "20260913-190859";

function frameSrc(index: number) {
  return `/hero-seq/${String(index).padStart(3, "0")}.webp?v=${SEQUENCE_VERSION}`;
}

export function HeroFramePlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const frames: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);
    let playing = false;
    let raf = 0;
    let last = 0;
    let index = 0;
    let stopped = false;
    let hasDrawnFirst = false;

    const draw = (img: HTMLImageElement) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;
      ctx.drawImage(
        img,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
    };

    const currentFrame = () => {
      for (let offset = 0; offset < FRAME_COUNT; offset += 1) {
        const candidate = frames[(index + offset) % FRAME_COUNT];
        if (candidate?.complete && candidate.naturalWidth > 0) {
          index = (index + offset) % FRAME_COUNT;
          return candidate;
        }
      }
      return undefined;
    };

    const tick = (time: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (time - last < 1000 / FPS) return;
      last = time;
      const img = currentFrame();
      if (img) draw(img);
      index = (index + 1) % FRAME_COUNT;
    };

    const start = () => {
      if (playing) return;
      playing = true;
      const img = currentFrame();
      if (img) {
        hasDrawnFirst = true;
        draw(img);
      }
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.max(1, Math.floor(rect.width * dpr));
      const targetHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const img = frames[index] ?? frames.find((frame) => frame?.naturalWidth);
        if (img?.naturalWidth) draw(img);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let next = 0;
    const loadOne = () => {
      if (stopped || next >= FRAME_COUNT) return;
      const slot = next;
      next += 1;
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(slot);
      img.onload = () => {
        if (!hasDrawnFirst && slot === 0) {
          hasDrawnFirst = true;
          draw(img);
        }
        loadOne();
      };
      img.onerror = () => loadOne();
      frames[slot] = img;
    };

    start();

    for (let worker = 0; worker < LOAD_WORKERS; worker += 1) loadOne();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      data-liquid-glass-source="hero"
      aria-hidden
    />
  );
}
