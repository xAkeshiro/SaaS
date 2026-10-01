import type { Transition, Variants } from "motion/react";

/** Signature easing: a strong ease-out, fast out and a soft landing. */
export const ease = [0.23, 1, 0.32, 1] as const;

/** UI motion (press, hover, swaps) stays under 300ms; only content reveals and the hero window run longer. */
export const durations = {
  fast: 0.16,
  base: 0.4,
  slow: 0.6,
} as const;

/*
 * Reveals animate `transform` strings, not x/y/scale shorthands, so motion can hand them to the
 * browser (WAAPI) instead of driving them from the main thread while the page hydrates.
 * Trade-off: MotionConfig's reducedMotion only neutralizes the shorthands, so reduced motion is
 * handled here, by snapping the transform while opacity still fades.
 */

type RevealOptions = {
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Pass `useReducedMotion()`: the element fades in place instead of rising. */
  reduce?: boolean | null;
};

function revealTransition(duration: number, { delay = 0, reduce = false }: RevealOptions): Transition {
  return {
    duration,
    ease,
    // Only set when needed: an explicit `delay: 0` would override a parent's stagger.
    ...(delay ? { delay } : null),
    ...(reduce ? { transform: { duration: 0 } } : null),
  };
}

/**
 * Reveal from below as variants. The delay lives in the variant's own transition because motion
 * ignores a component's `transition` prop once the variant defines one.
 * Hidden values are identical with or without `reduce`, so the server HTML always matches.
 */
export function fadeUpWith(options: RevealOptions = {}): Variants {
  return {
    hidden: { opacity: 0, transform: "translateY(10px)" },
    show: { opacity: 1, transform: "translateY(0px)", transition: revealTransition(durations.base, options) },
  };
}

/** Reveal from below. Use with `initial="hidden" whileInView="show"`. No blur: these are often large blocks. */
export const fadeUp: Variants = fadeUpWith();

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: durations.base, ease } },
};

/** The hero product window: rises in last. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, transform: "translateY(16px) scale(0.97)" },
  show: { opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: durations.slow, ease } },
};

/** Parent variant that staggers its children. */
export const stagger = (staggerChildren = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Standard viewport options for scroll-triggered reveals: fire early so fast scrollers never see blank blocks. */
export const viewport = { once: true, amount: 0.1, margin: "0px 0px -5% 0px" } as const;

/** Hover lift, for cards that are actually clickable. Static cards do not lift. */
export const hoverLift = {
  whileHover: { transform: "translateY(-2px)" },
  transition: { duration: durations.fast, ease },
} as const;
