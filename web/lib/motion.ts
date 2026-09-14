import type { Variants } from "motion/react";

/** Signature easing: fast out, soft landing (Cluely-style). */
export const ease = [0.22, 1, 0.36, 1] as const;

export const durations = {
  fast: 0.2,
  base: 0.5,
  slow: 0.8,
} as const;

/** Reveal from below. Use with `initial="hidden" whileInView="show"`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: durations.base, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: durations.base, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: durations.slow, ease } },
};

/** Parent variant that staggers its children. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Standard viewport options for scroll-triggered reveals. */
export const viewport = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const;

/** Hover lift for cards and buttons. */
export const hoverLift = {
  whileHover: { y: -3 },
  transition: { duration: durations.fast, ease },
} as const;
