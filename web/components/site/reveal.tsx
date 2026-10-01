"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { fadeUpWith, stagger, viewport } from "@/lib/motion";
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
 * The delay is baked into the variant (a `transition` prop would be ignored), and under reduced
 * motion the block fades in place without rising.
 */
export function Reveal({ delay = 0, group = false, staggerBy = 0.06, className, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={group ? stagger(staggerBy, delay) : fadeUpWith({ delay, reduce })}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ className, children, ...rest }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={cn(className)} variants={fadeUpWith({ reduce })} {...rest}>
      {children}
    </motion.div>
  );
}
