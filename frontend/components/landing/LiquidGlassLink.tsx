"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

import styles from "./LiquidGlassLink.module.css";

export type LiquidGlassController = { destroy: () => void };

declare global {
  interface Window {
    LiquidGlassBridge?: {
      mount: (
        root: HTMLElement,
        options: { text: string; size?: number },
      ) => LiquidGlassController | null;
      mountPanel: (root: HTMLElement) => LiquidGlassController | null;
    };
  }
}

const scriptPromises = new Map<string, Promise<void>>();

function loadScript(src: string) {
  const existing = scriptPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const present = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (present?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = present ?? document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    if (!present) document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export async function ensureLiquidGlassRuntime() {
  await loadScript("/vendor/liquid-glass-js/container.js");
  await loadScript("/vendor/liquid-glass-js/button.js");
  await loadScript("/vendor/liquid-glass-js/react-bridge.js?v=20260914-4");
}

export function LiquidGlassLink({ href, label }: { href: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: LiquidGlassController | null = null;

    async function mountGlass() {
      await ensureLiquidGlassRuntime();

      if (cancelled || !hostRef.current || !rootRef.current) return;
      controller = window.LiquidGlassBridge?.mount(hostRef.current, {
        text: " ",
        size: 18,
      }) ?? null;
      if (controller) rootRef.current.dataset.ready = "true";
    }

    void mountGlass().catch(() => {
      // The styled semantic link remains as a graceful fallback.
    });

    return () => {
      cancelled = true;
      controller?.destroy();
    };
  }, [label]);

  return (
    <div ref={rootRef} className={styles.root}>
      <span className={styles.fallback} aria-hidden="true" />
      <span ref={hostRef} className={styles.host} aria-hidden="true" />
      <Link href={href} className={styles.link} aria-label={label}>
        <span>{label}</span>
        <span className={styles.icon} aria-hidden="true">
          <ArrowUpRight size={15} strokeWidth={1.9} />
        </span>
      </Link>
    </div>
  );
}
