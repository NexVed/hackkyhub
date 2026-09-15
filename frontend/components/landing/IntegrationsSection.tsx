"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SolarSystem, OrbitConfig } from "@/components/ui/solar-system";
import { LiquidMetalLogo } from "@/components/landing/LiquidMetalLogo";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

const hackathonOrbits: OrbitConfig[] = [
  {
    id: "inner",
    name: "Inner Orbit",
    radiusClass: "var(--radius-inner)",
    radiusPx: 160,
    speed: 22,
    items: [
      {
        id: "devfolio",
        label: "Devfolio",
        color: "#3770FF",
        logoUrl: "/hackathons-logo/devfolio-icon-filled-256.png",
      },
      {
        id: "mlh",
        label: "MLH",
        color: "#E73427",
        logoUrl: "/hackathons-logo/mlh-logo-color.png",
      },
      {
        id: "hackerearth",
        label: "HackerEarth",
        color: "#2C3454",
        logoUrl: "/hackathons-logo/hackerearth.jpg",
      },
    ],
  },
  {
    id: "mid",
    name: "Middle Orbit",
    radiusClass: "var(--radius-mid)",
    radiusPx: 265,
    speed: 34,
    items: [
      {
        id: "unstop",
        label: "Unstop",
        color: "#1C4980",
        logoUrl: "/hackathons-logo/unstop-icon-800x800.png",
      },
      {
        id: "hack2skill",
        label: "Hack2Skill",
        color: "#FF6B00",
        logoUrl: "/hackathons-logo/hack2skill.png",
      },
      {
        id: "devpost",
        label: "Devpost",
        color: "#003E54",
        logoUrl: "/hackathons-logo/devpost.png",
      },
    ],
  },
  {
    id: "outer",
    name: "Outer Orbit",
    radiusClass: "var(--radius-outer)",
    radiusPx: 370,
    speed: 46,
    items: [
      {
        id: "hackculture",
        label: "HackCulture",
        color: "#A855F7",
        logoUrl: "/hackathons-logo/hackculture.png",
      },
      {
        id: "commudle",
        label: "Commudle",
        color: "#10B981",
        logoUrl: "/hackathons-logo/commudle-logo192.png",
      },
      {
        id: "devnovate",
        label: "Devnovate",
        color: "#8B5CF6",
        logoUrl: "/hackathons-logo/devnovate.svg.DEVNOVATE.Woblo.svg",
      },
    ],
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="relative z-10 min-h-screen w-full bg-black text-white flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-24 border-t border-white/5 overflow-hidden scroll-mt-20">
      <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">
        {/* LEFT COLUMN — Classic editorial typography & clean specs */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 sm:space-y-8">
          {/* Classic Section Label */}
          <ScrollReveal animation="fade-up" delay={0.05}>
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-medium tracking-[0.25em] text-zinc-500 uppercase">
                • Connected Ecosystem
              </span>
            </div>
          </ScrollReveal>

          {/* Editorial Headline */}
          <ScrollReveal animation="fade-up" delay={0.15}>
            <h2 className="text-[1.75rem] sm:text-4xl lg:text-[2.85rem] font-light leading-[1.14] tracking-[-0.035em] text-white">
              A single vantage point for
              <span className="block font-serif italic font-normal text-zinc-300 mt-1">
                every major hackathon.
              </span>
            </h2>
          </ScrollReveal>

          {/* Classic Narrative Description */}
          <ScrollReveal animation="fade-up" delay={0.25}>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
              Instead of fragmenting your attention across isolated platforms, HackkyHub continuously indexes schedules, prize pools, and community entries from premier collegiate leagues and developer arenas into one unified ledger.
            </p>
          </ScrollReveal>

          {/* Minimalist Specs List */}
          <ScrollRevealGroup staggerDelay={0.1} delay={0.3} className="space-y-4 pt-2 border-t border-white/10 max-w-lg">
            <ScrollRevealItem animation="fade-left">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-500 pt-0.5 select-none">01</span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Unified Aggregation</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Synchronized feeds across Devfolio, MLH, HackerEarth, and independent circuits with zero duplicate listings.
                  </p>
                </div>
              </div>
            </ScrollRevealItem>

            <ScrollRevealItem animation="fade-left">
              <div className="flex items-start gap-4 border-t border-white/5 pt-4">
                <span className="text-xs font-mono text-zinc-500 pt-0.5 select-none">02</span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Portable Team Rosters</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Assemble once, compete anywhere. Carry your roster, skill tags, and submission history through each season.
                  </p>
                </div>
              </div>
            </ScrollRevealItem>

            <ScrollRevealItem animation="fade-left">
              <div className="flex items-start gap-4 border-t border-white/5 pt-4">
                <span className="text-xs font-mono text-zinc-500 pt-0.5 select-none">03</span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Direct Verification</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Verified schedules and one-click redirection straight to official portal registration pipelines.
                  </p>
                </div>
              </div>
            </ScrollRevealItem>
          </ScrollRevealGroup>

          {/* Action Row */}
          <ScrollReveal animation="fade-up" delay={0.4} className="pt-2 flex flex-wrap items-center gap-5">
            <Link
              href="/dashboard/Find"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-black transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/5"
            >
              Explore directory
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-zinc-500 font-medium">
              Over 500+ active competitions indexed
            </span>
          </ScrollReveal>
        </div>

        {/* RIGHT COLUMN — 3D Solar System Orbit Component */}
        <ScrollReveal animation="scale-up" delay={0.2} className="lg:col-span-6 flex items-center justify-center relative min-h-[340px] sm:min-h-[420px] lg:min-h-[520px]">
          <SolarSystem
            centerLogo={<LiquidMetalLogo className="size-full" />}
            centerLogoAlt="HackkyHub Gateway"
            orbits={hackathonOrbits}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

export default IntegrationsSection;
