"use client";

import StatsBento from "@/components/ui/stats-bento";
import FeaturesCards from "@/components/ui/feature-shader-cards";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import type { Logo } from "@/components/ui/logo-marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const platformLogos: Logo[] = [
  { src: "/hackathons-logo/devfolio-icon-filled-256.png", alt: "Devfolio" },
  { src: "/hackathons-logo/mlh-logo-color.png", alt: "MLH" },
  { src: "/hackathons-logo/hackerearth.jpg", alt: "HackerEarth" },
  { src: "/hackathons-logo/unstop-icon-800x800.png", alt: "Unstop" },
  { src: "/hackathons-logo/hack2skill.png", alt: "Hack2Skill" },
  { src: "/hackathons-logo/hackculture.png", alt: "HackCulture" },
  { src: "/hackathons-logo/commudle-logo192.png", alt: "Commudle" },
];

export function AboutSection() {
  return (
    <section id="about" className="relative z-10 w-full bg-black text-white overflow-hidden scroll-mt-20">
      {/* ── Logo Marquee ── */}
      <div className="border-b border-white/5 py-2">
        <LogoMarquee logos={platformLogos} className="opacity-70" />
      </div>

      {/* ── About Content ── */}
      <div className="flex flex-col items-center justify-center px-5 pt-12 pb-10 sm:px-8 sm:pt-16 sm:pb-12">
        {/* Label */}
        <ScrollReveal animation="fade-up" delay={0.05}>
          <p className="mb-4 text-[0.68rem] font-medium tracking-[0.25em] text-zinc-500 uppercase">
            • The Platform
          </p>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal animation="fade-up" delay={0.15}>
          <h2 className="mx-auto max-w-3xl text-center text-3xl sm:text-4xl lg:text-[2.85rem] font-light leading-[1.14] tracking-[-0.035em] text-white">
            A universal gateway dedicated to
            <span className="block font-serif italic font-normal text-zinc-300 mt-1">
              building smarter teams and winning projects.
            </span>
          </h2>
        </ScrollReveal>

        {/* Subtitle */}
        <ScrollReveal animation="fade-up" delay={0.25}>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm sm:text-base leading-relaxed text-zinc-400 font-normal">
            One platform to discover competitions, assemble the right builders, and turn sharp ideas into projects that ship.
          </p>
        </ScrollReveal>

        {/* Stats Bento Grid */}
        <ScrollReveal animation="scale-up" delay={0.3} className="mt-14 w-full sm:mt-14">
          <StatsBento />
        </ScrollReveal>
      </div>

      {/* ── Feature Shader Cards ── */}
      <div id="features" className="scroll-mt-20">
        <FeaturesCards />
      </div>
    </section>
  );
}
