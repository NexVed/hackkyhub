"use client";

import React from "react";
import { motion, type HTMLMotionProps, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

export type AnimationType =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "blur-in";

export interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  as?: React.ElementType;
}

const animationVariants = {
  "fade-up": {
    hidden: { opacity: 0, y: 36, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -30, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -36, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 36, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.85,
  threshold = 0.15,
  once = true,
  className,
  ...props
}: ScrollRevealProps) {
  const variant = animationVariants[animation] || animationVariants["fade-up"];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={variant}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealGroup({
  children,
  staggerDelay = 0.1,
  delay = 0,
  className,
  ...props
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  delay?: number;
  className?: string;
} & HTMLMotionProps<"div">) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  animation = "fade-up",
  duration = 0.75,
  className,
  ...props
}: {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  className?: string;
} & HTMLMotionProps<"div">) {
  const variant = animationVariants[animation] || animationVariants["fade-up"];

  return (
    <motion.div
      variants={variant}
      transition={{
        duration,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
