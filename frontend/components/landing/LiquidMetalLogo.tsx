"use client";

import { LiquidMetal } from "@paper-design/shaders-react";

type LiquidMetalLogoProps = {
  className?: string;
};

export function LiquidMetalLogo({ className = "" }: LiquidMetalLogoProps) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <LiquidMetal
        image="/brand/hh-mask.svg"
        colorBack="#00000000"
        colorTint="#f8fafc"
        contour={0.58}
        distortion={0.16}
        softness={0.24}
        repetition={1.7}
        shiftRed={0}
        shiftBlue={0}
        angle={76}
        speed={0.32}
        scale={0.86}
        fit="contain"
        maxPixelCount={320000}
        className="relative z-10"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
