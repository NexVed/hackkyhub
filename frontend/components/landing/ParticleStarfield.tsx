"use client";

import { useEffect, useRef } from "react";

type Particle = {
  alpha: number;
  drift: number;
  phase: number;
  radius: number;
  twinkle: number;
  x: number;
  y: number;
};

function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createParticles(width: number, height: number) {
  const random = seededRandom(Math.round(width * 17 + height * 31));
  const count = Math.min(1800, Math.max(650, Math.round((width * height) / 800)));

  return Array.from({ length: count }, (_, index): Particle => {
    const inGalacticBand = index < count * 0.38;
    const x = random();
    const bandCenter = 0.43 + Math.sin(x * Math.PI * 1.25) * 0.055;
    const y = inGalacticBand
      ? Math.min(1, Math.max(0, bandCenter + (random() + random() + random() - 1.5) * 0.2))
      : random();
    const bright = random() > 0.975;

    return {
      x,
      y,
      radius: bright ? 0.85 + random() * 0.75 : 0.24 + random() * 0.52,
      alpha: bright ? 0.72 + random() * 0.28 : 0.18 + random() * 0.4,
      phase: random() * Math.PI * 2,
      twinkle: 0.45 + random() * 1.2,
      drift: 0.3 + random() * 0.8,
    };
  });
}

export function ParticleStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let stopped = false;
    let pointerActive = false;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const newWidth = Math.max(1, rect.width);
      const newHeight = Math.max(1, rect.height);
      const newCanvasWidth = Math.round(newWidth * dpr);
      const newCanvasHeight = Math.round(newHeight * dpr);

      if (
        canvas.width === newCanvasWidth &&
        canvas.height === newCanvasHeight &&
        particles.length > 0
      ) {
        return;
      }

      width = newWidth;
      height = newHeight;
      canvas.width = newCanvasWidth;
      canvas.height = newCanvasHeight;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height);
    };

    const draw = (timestamp: number) => {
      if (stopped) return;

      const time = timestamp / 1000;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);

      for (const particle of particles) {
        const motion = reducedMotion ? 0 : time * particle.drift;
        const baseX = (particle.x * width + motion) % width;
        const baseY = particle.y * height + (reducedMotion ? 0 : Math.sin(time * 0.09 + particle.phase) * 1.5);
        const distanceX = baseX - pointerX;
        const distanceY = baseY - pointerY;
        const distance = Math.hypot(distanceX, distanceY);
        const hoverStrength =
          !reducedMotion && pointerActive && distance < 180
            ? Math.pow(1 - distance / 180, 2)
            : 0;
        const push = hoverStrength * 30;
        const x = distance > 0 ? baseX + (distanceX / distance) * push : baseX;
        const y = distance > 0 ? baseY + (distanceY / distance) * push : baseY;
        const pulse = reducedMotion
          ? 1
          : 0.72 + Math.sin(time * particle.twinkle + particle.phase) * 0.28
            + Math.sin(time * 7 + particle.phase) * hoverStrength * 0.35;
        const alpha = Math.min(1, Math.max(0.08, particle.alpha * pulse + hoverStrength * 0.42));
        const radius = particle.radius * (1 + hoverStrength * 1.4);

        if (particle.radius > 0.8) {
          context.beginPath();
          context.fillStyle = `rgba(125, 190, 255, ${alpha * 0.18})`;
          context.arc(x, y, radius * 3, 0, Math.PI * 2);
          context.fill();
        }

        context.beginPath();
        context.fillStyle = `rgba(220, 235, 255, ${alpha})`;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      pointerActive =
        pointerX >= 0 && pointerX <= rect.width && pointerY >= 0 && pointerY <= rect.height;
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointerActive = false;
    };

    observer.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      data-liquid-glass-source="starfield"
      aria-hidden="true"
    />
  );
}
