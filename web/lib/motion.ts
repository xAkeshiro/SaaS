import type { Variants } from "motion/react";

/** Signature easing: a strong ease-out, fast out and a soft landing. */
export const ease = [0.23, 1, 0.32, 1] as const;

export const durations = {
  fast: 0.16,
  base: 0.55,
  slow: 0.8,
} as const;

/** Reveal from below, clearing a light blur as it lands. Use with `initial="hidden" whileInView="show"`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: durations.base, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: durations.base, ease } },
};

/** The hero product window: rises and sharpens last. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { duration: durations.slow, ease } },
};

/** Parent variant that staggers its children. */
export const stagger = (staggerChildren = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Standard viewport options for scroll-triggered reveals. */
export const viewport = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const;

/** Hover lift for cards. */
export const hoverLift = {
  whileHover: { y: -3 },
  transition: { duration: durations.fast, ease },
} as const;
