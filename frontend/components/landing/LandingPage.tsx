"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuToggle } from "@/components/ui/MenuToggle";

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
import { HackVishvaSignature } from "@/components/visuals/HackVishvaSignature";
import { WelcomeAnimation } from "@/components/dashboard/DashboardWelcome";

import styles from "./LandingPage.module.css";

const navigation = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
  { href: "#faq", label: "FAQ" },
];

export function LandingPage() {
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  const [heroReady, setHeroReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const markHeroReady = useCallback(() => setHeroReady(true), []);

  useEffect(() => {
    let mounted = true;
    const minimum = setTimeout(() => setMinimumElapsed(true), reduced ? 150 : 1200);
    // Asset failures or offline users must never get stuck behind the intro.
    const fallback = setTimeout(() => setIntroComplete(true), 8000);
    document.fonts.ready.then(() => { if (mounted) setFontsReady(true); });
    return () => { mounted = false; clearTimeout(minimum); clearTimeout(fallback); };
  }, [reduced]);
  useEffect(() => {
    if (minimumElapsed && heroReady && fontsReady) {
      const timer = setTimeout(() => setIntroComplete(true), 0);
      return () => clearTimeout(timer);
    }
  }, [minimumElapsed, heroReady, fontsReady]);
  useEffect(() => {
    if (introComplete) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [introComplete]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

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
      <AnimatePresence>{!introComplete && <WelcomeAnimation key="landing-intro" landing />}</AnimatePresence>
      <motion.div inert={!introComplete} aria-hidden={!introComplete || undefined} initial={false} animate={{ opacity: introComplete ? 1 : 0, y: introComplete || reduced ? 0 : 12 }} transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }} className="dark w-full min-h-screen overflow-x-hidden bg-black text-white no-scrollbar">
        {/* Floating Fixed Navbar across all sections */}
        <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-all duration-300 pointer-events-none min-[421px]:px-8 sm:bg-none sm:px-6 sm:py-5">
          <nav className="relative mx-auto flex h-14 max-w-[94rem] items-center justify-between sm:h-16 sm:px-4 pointer-events-none">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group flex min-w-0 items-center gap-2.5 pointer-events-auto sm:gap-3"
              aria-label="HackkyHub home"
            >
              <span className={`${styles.headerLogo} relative h-10 w-[3.25rem] shrink-0 overflow-hidden sm:h-9 sm:w-12`}>
                <LiquidMetalLogo className="size-full" />
              </span>
              <span className={styles.brandName}>
                HackkyHub
              </span>
            </Link>

            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block pointer-events-auto">
              <LiquidGlassNav items={navigation} activeSection={activeSection} />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-b from-white to-zinc-300 px-3 py-2.5 text-xs font-semibold tracking-tight text-black shadow-[0_0_28px_rgba(255,255,255,0.16)] transition-transform hover:-translate-y-0.5 sm:px-5 sm:py-3 sm:text-[0.95rem]"
              >
                Get started
              </Link>

              {/* Mobile menu button */}
              <MenuToggle open={mobileMenuOpen} onClick={() => setMobileMenuOpen((prev) => !prev)} controls="landing-mobile-menu" className="bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white md:hidden pointer-events-auto" />
            </div>
          </nav>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>{mobileMenuOpen && (
            <motion.div id="landing-mobile-menu" initial={{ opacity: 0, y: reduced ? 0 : -12, scale: reduced ? 1 : 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : 0.22 }} className="mx-auto mt-2 w-full max-w-[94rem] origin-top rounded-2xl border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl md:hidden pointer-events-auto">
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
            </motion.div>
          )}</AnimatePresence>
        </header>

        {/* Hero Section — full screen */}
        <section id="hero" className="relative isolate h-[100svh] min-h-[40rem] w-full overflow-hidden sm:min-h-[36rem]">
          <div className="absolute inset-0 -z-30" aria-hidden="true">
            <ParticleStarfield />
          </div>

          <div className={styles.edgeGlow} aria-hidden="true" />

          <div className={styles.heroWordmark} aria-hidden="true">
            <div className={`${styles.heroWord} ${styles.wordGradient}`}>HACKKYHUB</div>
            <span className={styles.wordSubtitle}>A UNIVERSAL HACKATHON GATEWAY</span>
          </div>

          <div
            className={`${styles.heroAnimation} pointer-events-none absolute inset-0 -z-10 left-[12%] sm:left-[20%] lg:left-[24%]`}
            aria-label="HackkyHub hero animation"
          >
            <HeroFramePlayer active={introComplete} onReady={markHeroReady} />
          </div>

          <section
            className={`${styles.heroCopy} absolute bottom-[12%] left-4 z-20 w-[min(20rem,26vw)] sm:left-6 lg:left-[3.5vw]`}
          >
            <h1 className="text-[clamp(2.2rem,3.8vw,4.25rem)] font-light leading-[1.12] tracking-[-0.04em] text-white">
              Build boldly.{" "}
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

        </section>

        {/* About Section */}
        <AboutSection />

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* FAQ Section */}
        <FAQLandingSection />

        {/* Cinematic Curtain Reveal Footer */}
        <div className="flex justify-center border-t border-white/5 bg-black py-8"><HackVishvaSignature /></div>
        <CinematicFooter />
      </motion.div>
    </SmoothScrollProvider>
  );
}
