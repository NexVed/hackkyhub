"use client"

import type React from "react"

import { Warp } from "@paper-design/shaders-react"
import { Search, Users, Zap, Palette, Smartphone, Globe } from "lucide-react"
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal"

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
}

const features: Feature[] = [
  {
    title: "Discover Hackathons",
    description:
      "Browse 500+ hackathons aggregated from Devfolio, MLH, Devpost, Unstop & more — all in one universal feed.",
    icon: <Search className="w-12 h-12 text-white" />,
  },
  {
    title: "Build Teams Fast",
    description:
      "Find teammates by skill, timezone, and interest. Match with builders who complement your strengths.",
    icon: <Users className="w-12 h-12 text-white" />,
  },
  {
    title: "Real-time Updates",
    description:
      "Get instant notifications for new hackathons, deadlines, and team invites — never miss an opportunity.",
    icon: <Zap className="w-12 h-12 text-white" />,
  },
  {
    title: "Smart Filters",
    description:
      "Filter by tech stack, prize pool, mode, and platform. Find exactly the hackathon that fits your goals.",
    icon: <Palette className="w-12 h-12 text-white" />,
  },
  {
    title: "Mobile Ready",
    description:
      "Fully responsive — browse hackathons, manage teams, and track deadlines on any device, anywhere.",
    icon: <Smartphone className="w-12 h-12 text-white" />,
  },
  {
    title: "Multi-Platform",
    description:
      "One gateway for 6+ platforms. No more jumping between sites — everything synced and searchable here.",
    icon: <Globe className="w-12 h-12 text-white" />,
  },
]

export default function FeaturesCards() {
  const getShaderConfig = (index: number) => {
    const configs = [
      {
        proportion: 0.3,
        softness: 0.8,
        distortion: 0.15,
        swirl: 0.6,
        swirlIterations: 8,
        shape: "checks" as const,
        shapeScale: 0.08,
        colors: ["hsl(280, 100%, 30%)", "hsl(320, 100%, 60%)", "hsl(340, 90%, 40%)", "hsl(300, 100%, 70%)"],
      },
      {
        proportion: 0.4,
        softness: 1.2,
        distortion: 0.2,
        swirl: 0.9,
        swirlIterations: 12,
        shape: "stripes" as const,
        shapeScale: 0.12,
        colors: ["hsl(200, 100%, 25%)", "hsl(180, 100%, 65%)", "hsl(160, 90%, 35%)", "hsl(190, 100%, 75%)"],
      },
      {
        proportion: 0.35,
        softness: 0.9,
        distortion: 0.18,
        swirl: 0.7,
        swirlIterations: 10,
        shape: "checks" as const,
        shapeScale: 0.1,
        colors: ["hsl(120, 100%, 25%)", "hsl(140, 100%, 60%)", "hsl(100, 90%, 30%)", "hsl(130, 100%, 70%)"],
      },
      {
        proportion: 0.45,
        softness: 1.1,
        distortion: 0.22,
        swirl: 0.8,
        swirlIterations: 15,
        shape: "stripes" as const,
        shapeScale: 0.09,
        colors: ["hsl(30, 100%, 35%)", "hsl(50, 100%, 65%)", "hsl(40, 90%, 40%)", "hsl(45, 100%, 75%)"],
      },
      {
        proportion: 0.38,
        softness: 0.95,
        distortion: 0.16,
        swirl: 0.85,
        swirlIterations: 11,
        shape: "checks" as const,
        shapeScale: 0.11,
        colors: ["hsl(250, 100%, 30%)", "hsl(270, 100%, 65%)", "hsl(260, 90%, 35%)", "hsl(265, 100%, 70%)"],
      },
      {
        proportion: 0.42,
        softness: 1.0,
        distortion: 0.19,
        swirl: 0.75,
        swirlIterations: 9,
        shape: "stripes" as const,
        shapeScale: 0.13,
        colors: ["hsl(330, 100%, 30%)", "hsl(350, 100%, 60%)", "hsl(340, 90%, 35%)", "hsl(345, 100%, 75%)"],
      },
    ]
    return configs[index % configs.length]
  }

  return (
    <section className="px-4 pt-10 pb-14 sm:pt-12 sm:pb-16 bg-black">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal animation="fade-up" className="text-center mb-9 sm:mb-12">
          <p className="mb-4 text-[0.68rem] font-medium tracking-[0.25em] text-zinc-500 uppercase">
            • Core Capabilities
          </p>
          <h2 className="text-[1.75rem] sm:text-4xl lg:text-[2.85rem] font-light leading-[1.14] tracking-[-0.035em] text-white">
            Everything required to
            <span className="block font-serif italic font-normal text-zinc-300 mt-1">
              compete, build, and ship.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed mt-4 font-normal">
            From discovering global competitions to coordinating cross-functional teams — every tool engineered for builder momentum.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index)
            return (
              <ScrollRevealItem key={index} animation="fade-up">
                <div className="relative h-64 sm:h-72 group transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <Warp
                      style={{ height: "100%", width: "100%" }}
                      proportion={shaderConfig.proportion}
                      softness={shaderConfig.softness}
                      distortion={shaderConfig.distortion}
                      swirl={shaderConfig.swirl}
                      swirlIterations={shaderConfig.swirlIterations}
                      shape={shaderConfig.shape}
                      shapeScale={shaderConfig.shapeScale}
                      scale={1}
                      rotation={0}
                      speed={0.8}
                      colors={shaderConfig.colors}
                    />
                  </div>

                  <div className="relative z-10 p-6 sm:p-8 rounded-3xl h-full flex flex-col bg-black/80 border border-white/10 transition-all duration-300 group-hover:border-white/20 group-hover:bg-black/75">
                    <div className="mb-5 filter drop-shadow-lg">{feature.icon}</div>

                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>

                    <p className="leading-relaxed flex-grow text-zinc-300 text-sm">{feature.description}</p>

                    <div className="mt-5 flex items-center text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors cursor-pointer">
                      <span className="mr-2">Learn more</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </ScrollRevealItem>
            )
          })}
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
