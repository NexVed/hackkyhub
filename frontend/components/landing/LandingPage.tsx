"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { AboutSection } from "@/components/landing/AboutSection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { FAQLandingSection } from "@/components/landing/FAQLandingSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { HeroFramePlayer } from "@/components/landing/HeroFramePlayer";
import { LiquidGlassLink } from "@/components/landing/LiquidGlassLink";
import { LiquidGlassNav } from "@/components/landing/LiquidGlassNav";
import { LiquidMetalLogo } from "@/components/landing/LiquidMetalLogo";
import { ParticleStarfield } from "@/components/landing/ParticleStarfield";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

import styles from "./LandingPage.module.css";

const navigation = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
  { href: "#faq", label: "FAQ" },
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");
    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ["faq", "integrations", "features", "about"];
      const scrollPosition = window.scrollY + 250;

      let matched = "";
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            matched = id;
            break;
          }
        }
      }
      setActiveSection(matched);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <SmoothScrollProvider>
      <div className="w-full min-h-screen overflow-x-hidden bg-black text-white no-scrollbar">
        {/* Floating Fixed Navbar across all sections */}
        <header
          className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 px-3 sm:px-6 ${
            scrolled
              ? "py-2.5 bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              : "py-3 sm:py-5 bg-transparent"
          }`}
        >
          <nav className="relative mx-auto flex h-16 max-w-[94rem] items-center justify-between px-3 sm:px-4">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group flex items-center gap-3"
              aria-label="HackkyHub home"
            >
              <span className={`${styles.headerLogo} relative h-9 w-12 overflow-hidden`}>
                <LiquidMetalLogo className="size-full" />
              </span>
              <span className={styles.brandName}>
                HackkyHub
              </span>
            </Link>

            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
              <LiquidGlassNav items={navigation} activeSection={activeSection} />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-b from-white to-zinc-300 px-4 py-2.5 text-[0.88rem] font-semibold tracking-tight text-black shadow-[0_0_28px_rgba(255,255,255,0.16)] transition-transform hover:-translate-y-0.5 sm:px-5 sm:py-3 sm:text-[0.95rem]"
              >
                Get started
              </Link>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mx-auto mt-2 w-full max-w-[94rem] rounded-2xl border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl md:hidden">
              <div className="flex flex-col gap-1.5">
                {navigation.map((item) => {
                  const isActive = activeSection === item.href.replace("#", "");
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        const target = document.querySelector(item.href);
                        if (target) {
                          target.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Hero Section — full screen */}
        <section id="hero" className="relative isolate h-screen w-full overflow-hidden">
          <div className="absolute inset-0 -z-30" aria-hidden="true">
            <ParticleStarfield />
          </div>

          <div className={styles.edgeGlow} aria-hidden="true" />

          <div className={styles.heroWordmark} aria-hidden="true">
            <div className={`${styles.heroWord} ${styles.wordGradient}`}>HACKKYHUB</div>
            <span className={styles.wordSubtitle}>A UNIVERSAL HACKATHON GATEWAY</span>
          </div>

          <div
            className="pointer-events-none absolute inset-0 -z-10 left-[12%] sm:left-[20%] lg:left-[24%]"
            aria-label="HackkyHub hero animation"
          >
            <HeroFramePlayer />
          </div>

          <section
            className={`${styles.heroCopy} absolute bottom-[12%] left-4 z-20 hidden w-[min(20rem,26vw)] sm:block sm:left-6 lg:left-[3.5vw]`}
          >
            <h1 className="text-[clamp(2.2rem,3.8vw,4.25rem)] font-light leading-[1.12] tracking-[-0.04em] text-white">
              Build boldly.
              <span className={`${styles.silverText} block font-medium italic`}>
                Win together.
              </span>
            </h1>
            <p className="mt-4 max-w-[20rem] text-[clamp(0.8rem,1vw,0.95rem)] leading-6 text-zinc-400">
              Discover ambitious hackathons, meet the right teammates, and turn sharp ideas into
              projects that ship.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <LiquidGlassLink href="/dashboard/Find" label="Explore" />
              <span className="hidden text-[0.58rem] leading-tight tracking-[0.12em] text-zinc-600 uppercase xl:block">
                Create. Connect.
                <br />
                Compete.
              </span>
            </div>
          </section>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/65 to-transparent" />

          <section
            className="absolute inset-x-4 bottom-4 z-30 rounded-2xl border border-white/10 bg-black/65 p-4 backdrop-blur-xl sm:hidden"
          >
            <p className="text-[0.58rem] tracking-[0.18em] text-zinc-500 uppercase">
              Where builders meet momentum
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-light leading-none tracking-[-0.06em]">Build boldly.</h1>
                <p className={`${styles.silverText} text-3xl font-medium leading-none italic`}>Win together.</p>
              </div>
              <Link
                href="/signup"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-lg text-black"
                aria-label="Get started"
              >
                ↗
              </Link>
            </div>
          </section>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* FAQ Section */}
        <FAQLandingSection />

        {/* Cinematic Curtain Reveal Footer */}
        <CinematicFooter />
      </div>
    </SmoothScrollProvider>
  );
}
