"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, Compass, Users, Sparkles, Heart } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  /* Dynamic Variables using standard shadcn/tailwind v4 tokens */
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in oklch, var(--primary) 15%, transparent) 0%, 
    color-mix(in oklch, var(--secondary) 15%, transparent) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: clamp(3.2rem, 16vw, 16.5vw);
  line-height: 0.72;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1.5px color-mix(in oklch, var(--foreground) 10%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 18%, transparent) 0%, transparent 80%);
  -webkit-background-clip: text;
  background-clip: text;
  transform-origin: center bottom;
  display: block;
  width: 100%;
  text-align: center;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
  display: inline-block;
  line-height: 1.18;
  padding-bottom: 0.18em;
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.HTMLAttributes<HTMLElement> & {
  as?: any;
  href?: string;
  onClick?: (e: React.MouseEvent<any>) => void;
  children?: React.ReactNode;
  className?: string;
};

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    const DynamicComponent = Component;

    return (
      <DynamicComponent
        ref={(node: HTMLElement | null) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node as any);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </DynamicComponent>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
export interface CinematicFooterProps {
  brandName?: string;
  giantText?: string;
  heading?: React.ReactNode;
  marqueeItems?: string[];
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  copyrightText?: string;
  className?: string;
}

const defaultMarquee = [
  "Universal Hackathon Gateway",
  "Verified Circuits",
  "Portable Team Rosters",
  "Cross-Platform Index",
  "Real-Time Deadlines",
  "Direct Organizers Redirect",
];

export function CinematicFooter({
  brandName = "HackkyHub",
  giantText = "HACKKYHUB",
  heading = (
    <>
      Ready to build?
    </>
  ),
  marqueeItems = defaultMarquee,
  primaryActionLabel = "Explore Hackathons",
  primaryActionHref = "/dashboard/Find",
  secondaryActionLabel = "Assemble Teams",
  secondaryActionHref = "/dashboard/Teams",
  copyrightText = " 2026 HackkyHub. All rights reserved.",
  className,
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: 20, scale: 0.98, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box. 
      */}
      <div
        ref={wrapperRef}
        className={cn("relative h-[100svh] min-h-[40rem] w-full", className)}
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer className="fixed bottom-0 left-0 flex h-[100svh] min-h-[40rem] w-full flex-col justify-between overflow-hidden bg-black text-white dark cinematic-footer-wrapper">
          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text - anchored at bottom, centered horizontally */}
          <div className="absolute bottom-0 inset-x-0 w-full flex justify-center items-end pointer-events-none select-none z-0 overflow-hidden leading-none">
            <div
              ref={giantTextRef}
              className="footer-giant-bg-text w-full text-center whitespace-nowrap uppercase select-none pointer-events-none will-change-transform"
            >
              {giantText}
            </div>
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/10 bg-black/60 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-zinc-400 uppercase">
              <div className="flex items-center space-x-12 px-6">
                {marqueeItems.map((item, idx) => (
                  <React.Fragment key={`marquee-1-${idx}`}>
                    <span>{item}</span>
                    <span className="text-zinc-600">•</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center space-x-12 px-6">
                {marqueeItems.map((item, idx) => (
                  <React.Fragment key={`marquee-2-${idx}`}>
                    <span>{item}</span>
                    <span className="text-zinc-600">•</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-4xl sm:text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-7 sm:mb-10 text-center leading-[1.18] pb-2 overflow-visible"
            >
              {heading}
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary Actions */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as={Link}
                  href={primaryActionHref}
                  className="footer-glass-pill w-full justify-center px-6 sm:w-auto sm:px-10 py-4 sm:py-5 rounded-full text-white font-semibold text-sm sm:text-base flex items-center gap-3 group transition-all"
                >
                  <Compass className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                  {primaryActionLabel}
                </MagneticButton>

                <MagneticButton
                  as={Link}
                  href={secondaryActionHref}
                  className="footer-glass-pill w-full justify-center px-6 sm:w-auto sm:px-10 py-4 sm:py-5 rounded-full text-white font-semibold text-sm sm:text-base flex items-center gap-3 group transition-all"
                >
                  <Users className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                  {secondaryActionLabel}
                </MagneticButton>
              </div>

              {/* Secondary Text Links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                <MagneticButton
                  as={Link}
                  href="/dashboard/MNC%20hackathons"
                  className="footer-glass-pill px-6 py-3 rounded-full text-zinc-400 font-medium text-xs md:text-sm hover:text-white transition-colors"
                >
                  All Hackathons
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/signup"
                  className="footer-glass-pill px-6 py-3 rounded-full text-zinc-400 font-medium text-xs md:text-sm hover:text-white transition-colors"
                >
                  Join as Builder
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/dashboard/Find"
                  className="footer-glass-pill px-6 py-3 rounded-full text-zinc-400 font-medium text-xs md:text-sm hover:text-white transition-colors"
                >
                  Gateway Feeds
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-5 px-4 sm:pb-8 sm:px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
            {/* Copyright */}
            <div className="text-zinc-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              {copyrightText}
            </div>

            {/* "Crafted for Builders" Badge */}
            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-white/10">
              <span className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                Crafted with
              </span>
              <Heart className="size-3.5 fill-red-500 text-red-500 animate-footer-heartbeat" />
              <span className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                for
              </span>
              <span className="text-white font-black text-xs md:text-sm tracking-normal ml-1">
                {brandName}
              </span>
            </div>

            {/* Back to top */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-zinc-400 hover:text-white group order-3 transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CinematicFooter;
