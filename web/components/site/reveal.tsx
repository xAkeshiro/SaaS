"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { fadeUp, stagger, viewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Render as a stagger parent; children should be <RevealItem>. */
  group?: boolean;
  /** Stagger between children when `group` is set. */
  staggerBy?: number;
};

/**
 * Scroll-triggered reveal. Server components can wrap any markup in it.
 * Respects prefers-reduced-motion through the global MotionConfig.
 */
export function Reveal({ delay = 0, group = false, staggerBy = 0.08, className, children, ...rest }: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={group ? stagger(staggerBy, delay) : fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      transition={group ? undefined : { delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(className)} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}
