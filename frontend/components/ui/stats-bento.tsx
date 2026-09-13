import React from "react";
import { Zap } from "lucide-react";
import { motion } from "motion/react";

export const StatsBento = () => {
  return (
    <div className="flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 max-w-7xl mx-auto w-full">
        {/* Primary Stat */}
        <div className="md:col-span-3 md:row-span-2 bg-white rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative group transition-transform duration-300 hover:-translate-y-0.5">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[repeating-linear-gradient(45deg,#808080_0px_1px,transparent_1px_10px)] opacity-30 mask-[radial-gradient(ellipse_80%_50%_at_100%_0%,#000_70%,transparent_110%)] pointer-events-none"></div>
          <div>
            <span className="inline-block px-3 py-1 bg-black/10 rounded-full text-[10px] font-semibold text-black/60 uppercase tracking-widest mb-6">
              Hackathons Tracked
            </span>
            <h3 className="text-6xl tracking-tighter text-black font-light">
              500+
            </h3>
          </div>
          <p className="text-black/60 text-sm max-w-xs">
            Aggregated from Devfolio, MLH, Devpost, Unstop, HackerEarth &amp;
            more — all in one universal gateway.
          </p>
        </div>

        {/* Secondary Stat A */}
        <div className="md:col-span-3 bg-zinc-900 rounded-3xl p-8 border border-white/10 flex items-center justify-between transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              User Growth
            </p>
            <p className="text-3xl text-white font-light">+240%</p>
          </div>
          <div className="flex gap-1 items-end h-8">
            {[10, 20, 40, 30, 60, 50, 80, 70, 90, 100, 110].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0.3 }}
                whileInView={{ height: `${h}%`, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.035, ease: "easeOut" }}
                className="w-1.5 bg-white rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Tertiary Stat B */}
        <div className="md:col-span-1 bg-zinc-900 rounded-3xl p-6 border border-white/10 flex flex-col justify-center text-center">
          <p className="text-2xl text-white">6+</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Platforms
          </p>
        </div>

        {/* Tertiary Stat C */}
        <div className="md:col-span-2 bg-zinc-900 rounded-3xl p-6 border border-white/10 flex items-center gap-4">
          <div className="size-10 rounded-full bg-gradient-to-b from-white via-zinc-100 to-zinc-300 text-black flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(255,255,255,0.18)] border border-white/40">
            <Zap className="h-5 w-5 fill-black" />
          </div>
          <div>
            <p className="text-sm text-white leading-none">250+ Teams</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              Formed &amp; shipped projects
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBento;
