"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

import {
  ensureLiquidGlassRuntime,
  type LiquidGlassController,
} from "./LiquidGlassLink";
import styles from "./LiquidGlassNav.module.css";

type NavigationItem = { href: string; label: string };

export function LiquidGlassNav({
  items,
  activeSection,
}: {
  items: NavigationItem[];
  activeSection?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    let cancelled = false;
    let controller: LiquidGlassController | null = null;

    async function mountGlass() {
      await ensureLiquidGlassRuntime();
      if (cancelled || !hostRef.current) return;
      controller = window.LiquidGlassBridge?.mountPanel(hostRef.current) ?? null;
    }

    void mountGlass().catch(() => {
      // The CSS glass surface remains available if WebGL initialization fails.
    });

    return () => {
      cancelled = true;
      controller?.destroy();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        scrollTo(target as HTMLElement, { offset: -80 });
      } else {
        scrollTo(href, { offset: -80 });
      }
    }
  };

  return (
    <div className={`${styles.root} hidden md:flex`}>
      <span ref={hostRef} className={styles.host} aria-hidden="true" />
      <div className={styles.links}>
        {items.map((item) => {
          const isActive = activeSection === item.href.replace("#", "");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
